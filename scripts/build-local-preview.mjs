import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  })

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

run(path.join(root, 'node_modules/.bin/esbuild'), [
  'src/main.jsx',
  '--bundle',
  '--outfile=dist/assets/local-index.js',
  '--format=esm',
  '--jsx=automatic',
  '--loader:.png=file',
  '--asset-names=[name]-local-[hash]',
  '--public-path=/assets',
  '--log-level=info',
])

run(path.join(root, 'node_modules/.bin/tailwindcss'), [
  '-i',
  'src/index.css',
  '-o',
  'dist/assets/local-index.css',
  '--minify',
])
