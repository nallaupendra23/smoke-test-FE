/* Plan-based feature gating — single source of truth.
 *
 * To re-tier a feature, edit the plan list here (one place). Plan keys are
 * lowercase: 'essential' | 'pro' | 'enterprise' (legacy 'free'/'basic' → locked).
 *
 * NOTE: this is FRONTEND gating (hides/locks the UI). It must be backed by
 * server-side enforcement on the POS connect path before launch — otherwise a
 * user could call the API directly. See the POS MVP plan's SECURITY TODO.
 */

// Tiers that can connect a real POS (Square/Clover/Toast).
// The knowledge-base / manual menu path stays available to ALL tiers.
export const POS_ENABLED_PLANS = ['pro', 'enterprise']

export const planHasPOS = (plan) =>
  POS_ENABLED_PLANS.includes(String(plan || '').toLowerCase())
