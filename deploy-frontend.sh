#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# RingAI Frontend — Fargate Deployment to a NEW AWS Account
# Builds the React/Nginx SPA and serves it from ECS Fargate.
# The frontend container also reverse-proxies /api/* and /voice to backend
# services via ECS Cloud Map DNS (ringai.local namespace).
#
# Pre-requisite: deploy-backend.sh must have run first so that the
#   ringai-alb and ringai-backend-cluster already exist.
#
# Requires: aws-cli v2, docker (running), jq
# Usage:    AWS_REGION=us-east-1 bash deploy-frontend.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config (override via env vars if needed) ──────────────────────────────────
AWS_REGION="${AWS_REGION:-us-east-2}"
CLUSTER="ringai-frontend-cluster"   # separate cluster keeps frontend vCPU quota isolated
ALB_NAME="ringai-alb"               # must match the ALB created by deploy-backend.sh
NAMESPACE="ringai.local"            # Cloud Map namespace (created by deploy-backend.sh)
CERT_ARN="${CERT_ARN:-}"            # Optional: ACM cert ARN for HTTPS

# Vite build-time env vars (baked into the SPA bundle at build time)
# These point at the public ALB DNS or your custom domain.
VITE_API_URL="${VITE_API_URL:-}"    # e.g. https://api.yourdomain.com  (leave blank = same origin)
VITE_APP_ENV="${VITE_APP_ENV:-production}"

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()     { echo -e "${RED}[FAIL]${NC}  $*" >&2; exit 1; }

# ── Prerequisites ─────────────────────────────────────────────────────────────
command -v aws    &>/dev/null || die "aws-cli not found"
command -v docker &>/dev/null || die "docker not found"
command -v jq     &>/dev/null || die "jq not found"
docker info &>/dev/null       || die "Docker daemon not running — start Docker Desktop"

# ── Dynamic account info ──────────────────────────────────────────────────────
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

info "AWS Account : $AWS_ACCOUNT"
info "Region      : $AWS_REGION"
info "Cluster     : $CLUSTER"
info "Build dir   : $SCRIPT_DIR"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — ECR login & create repo
# ─────────────────────────────────────────────────────────────────────────────
info "Step 1/9 — ECR login and repo setup..."
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"
success "ECR login OK"

REPO="ringai/frontend"
if aws ecr describe-repositories --repository-names "$REPO" --region "$AWS_REGION" &>/dev/null; then
  warn "ECR repo $REPO already exists — skipping"
else
  aws ecr create-repository \
    --repository-name "$REPO" \
    --region "$AWS_REGION" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    --output table
  success "Created ECR repo: $REPO"
fi

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Build & push frontend image
# ─────────────────────────────────────────────────────────────────────────────
info "Step 2/9 — Building frontend Docker image..."
IMAGE="${ECR_REGISTRY}/${REPO}:latest"

[[ -f "${SCRIPT_DIR}/Dockerfile" ]] || die "Dockerfile not found in $SCRIPT_DIR"

# Pass Vite env vars as Docker build args so they get baked into the bundle
BUILD_ARGS="--platform linux/amd64"
[[ -n "$VITE_API_URL" ]] && BUILD_ARGS="$BUILD_ARGS --build-arg VITE_API_URL=${VITE_API_URL}"
BUILD_ARGS="$BUILD_ARGS --build-arg VITE_APP_ENV=${VITE_APP_ENV}"

docker build $BUILD_ARGS -t "$IMAGE" "$SCRIPT_DIR"
docker push "$IMAGE"
success "Pushed: $IMAGE"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Create ECS cluster
# ─────────────────────────────────────────────────────────────────────────────
info "Step 3/9 — Creating ECS cluster..."
if aws ecs describe-clusters --clusters "$CLUSTER" --region "$AWS_REGION" \
     --query "clusters[?status=='ACTIVE'] | length(@)" --output text 2>/dev/null | grep -q '^[1-9]'; then
  warn "Cluster $CLUSTER already exists — skipping"
else
  aws ecs create-cluster \
    --cluster-name "$CLUSTER" \
    --region "$AWS_REGION" \
    --capacity-providers FARGATE FARGATE_SPOT \
    --default-capacity-provider-strategy \
        capacityProvider=FARGATE,weight=1,base=1 \
    --output table
  success "Created cluster: $CLUSTER"
fi

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Ensure IAM execution role exists
# ─────────────────────────────────────────────────────────────────────────────
info "Step 4/9 — Ensuring IAM roles exist..."
EXECUTION_ROLE_NAME="ringai-task-execution-role"
TASK_ROLE_NAME="ringai-task-role"
ECS_TRUST='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

for role_name in "$EXECUTION_ROLE_NAME" "$TASK_ROLE_NAME"; do
  if aws iam get-role --role-name "$role_name" &>/dev/null; then
    warn "IAM role $role_name already exists"
  else
    aws iam create-role \
      --role-name "$role_name" \
      --assume-role-policy-document "$ECS_TRUST" \
      --output table
    success "Created IAM role: $role_name"
  fi
done

aws iam attach-role-policy \
  --role-name "$EXECUTION_ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" 2>/dev/null || true

EXECUTION_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT}:role/${EXECUTION_ROLE_NAME}"
TASK_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT}:role/${TASK_ROLE_NAME}"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — Detect networking
# ─────────────────────────────────────────────────────────────────────────────
info "Step 5/9 — Detecting VPC and networking..."
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --query "Vpcs[0].VpcId" \
  --output text --region "$AWS_REGION" 2>/dev/null)
[[ "$VPC_ID" == "None" || -z "$VPC_ID" ]] && die "No default VPC found."
success "Using VPC: $VPC_ID"

SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=${VPC_ID}" "Name=defaultForAz,Values=true" \
  --query "Subnets[].SubnetId" \
  --output json --region "$AWS_REGION" | jq -r 'join(",")')
[[ -n "$SUBNET_IDS" ]] || die "No default subnets found."
success "Using subnets: $SUBNET_IDS"

# Reuse the ECS security group created by deploy-backend.sh, or create it
ECS_SG_NAME="ringai-ecs-sg"
ECS_SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=${ECS_SG_NAME}" "Name=vpc-id,Values=${VPC_ID}" \
  --query "SecurityGroups[0].GroupId" \
  --output text --region "$AWS_REGION" 2>/dev/null)

if [[ "$ECS_SG_ID" == "None" || -z "$ECS_SG_ID" ]]; then
  ECS_SG_ID=$(aws ec2 create-security-group \
    --group-name "$ECS_SG_NAME" \
    --description "RingAI ECS Fargate tasks" \
    --vpc-id "$VPC_ID" \
    --region "$AWS_REGION" \
    --query GroupId --output text)
  aws ec2 authorize-security-group-egress  --group-id "$ECS_SG_ID" --protocol all --cidr 0.0.0.0/0 --region "$AWS_REGION" 2>/dev/null || true
  aws ec2 authorize-security-group-ingress --group-id "$ECS_SG_ID" --protocol tcp  --port 8080 --cidr 0.0.0.0/0 --region "$AWS_REGION" 2>/dev/null || true
  success "Created security group: $ECS_SG_ID"
else
  # Make sure port 8080 is open
  aws ec2 authorize-security-group-ingress --group-id "$ECS_SG_ID" --protocol tcp --port 8080 --cidr 0.0.0.0/0 --region "$AWS_REGION" 2>/dev/null || true
  warn "Security group $ECS_SG_NAME already exists: $ECS_SG_ID"
fi

# ─────────────────────────────────────────────────────────────────────────────
# STEP 6 — Find ALB and create target group
# ─────────────────────────────────────────────────────────────────────────────
info "Step 6/9 — Setting up ALB target group..."
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names "$ALB_NAME" \
  --region "$AWS_REGION" \
  --query "LoadBalancers[0].LoadBalancerArn" \
  --output text 2>/dev/null || echo "")

if [[ -z "$ALB_ARN" || "$ALB_ARN" == "None" ]]; then
  die "ALB '$ALB_NAME' not found. Run deploy-backend.sh first (it creates the ALB), then re-run this script."
fi
success "Found ALB: $ALB_ARN"

TG_NAME="ringai-frontend"
TG_ARN=$(aws elbv2 describe-target-groups \
  --names "$TG_NAME" \
  --region "$AWS_REGION" \
  --query "TargetGroups[0].TargetGroupArn" \
  --output text 2>/dev/null || echo "")

if [[ -z "$TG_ARN" || "$TG_ARN" == "None" ]]; then
  TG_ARN=$(aws elbv2 create-target-group \
    --name "$TG_NAME" \
    --protocol HTTP \
    --port 8080 \
    --vpc-id "$VPC_ID" \
    --target-type ip \
    --health-check-protocol HTTP \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --region "$AWS_REGION" \
    --query "TargetGroups[0].TargetGroupArn" \
    --output text)
  success "Created target group: $TG_NAME → $TG_ARN"
else
  warn "Target group $TG_NAME already exists — reusing"
fi

# ─────────────────────────────────────────────────────────────────────────────
# STEP 7 — CloudWatch log group
# ─────────────────────────────────────────────────────────────────────────────
info "Step 7/9 — Creating CloudWatch log group..."
aws logs create-log-group --log-group-name "/ecs/ringai-frontend" --region "$AWS_REGION" 2>/dev/null || true
aws logs put-retention-policy --log-group-name "/ecs/ringai-frontend" --retention-in-days 30 --region "$AWS_REGION" 2>/dev/null || true
success "Log group: /ecs/ringai-frontend"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 8 — Register task definition
# ─────────────────────────────────────────────────────────────────────────────
info "Step 8/9 — Registering frontend task definition..."
aws ecs register-task-definition \
  --family "ringai-frontend" \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu "256" \
  --memory "512" \
  --execution-role-arn "$EXECUTION_ROLE_ARN" \
  --task-role-arn "$TASK_ROLE_ARN" \
  --container-definitions "[{
    \"name\": \"frontend\",
    \"image\": \"${IMAGE}\",
    \"essential\": true,
    \"portMappings\": [{\"containerPort\": 8080, \"protocol\": \"tcp\"}],
    \"environment\": [
      {\"name\": \"VITE_APP_ENV\", \"value\": \"${VITE_APP_ENV}\"}
    ],
    \"logConfiguration\": {
      \"logDriver\": \"awslogs\",
      \"options\": {
        \"awslogs-group\": \"/ecs/ringai-frontend\",
        \"awslogs-region\": \"${AWS_REGION}\",
        \"awslogs-stream-prefix\": \"ecs\"
      }
    },
    \"healthCheck\": {
      \"command\": [\"CMD-SHELL\", \"wget -qO- http://localhost:8080/health || exit 1\"],
      \"interval\": 30,
      \"timeout\": 5,
      \"retries\": 3,
      \"startPeriod\": 10
    }
  }]" \
  --region "$AWS_REGION" \
  --output table > /dev/null
success "Registered task definition: ringai-frontend"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 9 — Create ECS service and set ALB default rule
# ─────────────────────────────────────────────────────────────────────────────
info "Step 9/9 — Creating frontend ECS service..."

SVC_NAME="ringai-frontend"
EXISTING=$(aws ecs describe-services \
  --cluster "$CLUSTER" \
  --services "$SVC_NAME" \
  --region "$AWS_REGION" \
  --query "services[?status=='ACTIVE'] | length(@)" \
  --output text 2>/dev/null)

if [[ "$EXISTING" -ge 1 ]]; then
  warn "Service $SVC_NAME already exists — updating"
  aws ecs update-service \
    --cluster "$CLUSTER" \
    --service "$SVC_NAME" \
    --task-definition "ringai-frontend" \
    --force-new-deployment \
    --region "$AWS_REGION" \
    --output table > /dev/null
  success "Updated service: $SVC_NAME"
else
  aws ecs create-service \
    --cluster "$CLUSTER" \
    --service-name "$SVC_NAME" \
    --task-definition "ringai-frontend" \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_IDS}],securityGroups=[${ECS_SG_ID}],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=${TG_ARN},containerName=frontend,containerPort=8080" \
    --health-check-grace-period-seconds 30 \
    --region "$AWS_REGION" \
    --output table > /dev/null
  success "Created service: $SVC_NAME"
fi

# Set frontend as the DEFAULT target on the ALB HTTP listener
# (all paths not matched by backend rules fall through to the SPA)
HTTP_LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn "$ALB_ARN" \
  --region "$AWS_REGION" \
  --query "Listeners[?Port==\`80\`].ListenerArn | [0]" \
  --output text 2>/dev/null)

if [[ -n "$HTTP_LISTENER_ARN" && "$HTTP_LISTENER_ARN" != "None" ]]; then
  aws elbv2 modify-listener \
    --listener-arn "$HTTP_LISTENER_ARN" \
    --default-actions "Type=forward,TargetGroupArn=${TG_ARN}" \
    --region "$AWS_REGION" \
    --output table > /dev/null
  success "Set frontend as ALB HTTP default target"
fi

# Same for HTTPS listener if present
if [[ -n "$CERT_ARN" ]]; then
  HTTPS_LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn "$ALB_ARN" \
    --region "$AWS_REGION" \
    --query "Listeners[?Port==\`443\`].ListenerArn | [0]" \
    --output text 2>/dev/null)

  if [[ -n "$HTTPS_LISTENER_ARN" && "$HTTPS_LISTENER_ARN" != "None" ]]; then
    aws elbv2 modify-listener \
      --listener-arn "$HTTPS_LISTENER_ARN" \
      --default-actions "Type=forward,TargetGroupArn=${TG_ARN}" \
      --region "$AWS_REGION" \
      --output table > /dev/null
    success "Set frontend as ALB HTTPS default target"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────────────────────────────────────
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns "$ALB_ARN" \
  --region "$AWS_REGION" \
  --query "LoadBalancers[0].DNSName" \
  --output text)

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  RingAI Frontend deployed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  URL       : http://${ALB_DNS}"
[[ -n "$CERT_ARN" ]] && echo "            : https://${ALB_DNS}"
echo "  Cluster   : $CLUSTER"
echo "  Region    : $AWS_REGION"
echo ""
echo -e "${CYAN}  Point your domain's CNAME/A-record at: ${ALB_DNS}${NC}"
echo ""
