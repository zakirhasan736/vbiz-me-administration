import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Keep in sync with src/lib/dom/patchReactDomHoistable.ts */
const GUARDS = [
  [
    'deletedFiber.parentNode.removeChild(deletedFiber)',
    'deletedFiber.parentNode&&deletedFiber.parentNode.removeChild(deletedFiber)',
  ],
  [
    'finishedRoot.parentNode.removeChild(finishedRoot)',
    'finishedRoot.parentNode&&finishedRoot.parentNode.removeChild(finishedRoot)',
  ],
  ['current.parentNode.removeChild(current)', 'current.parentNode&&current.parentNode.removeChild(current)'],
]

function apply(source) {
  let next = source
  for (const [from, to] of GUARDS) {
    if (next.includes(to)) continue
    next = next.split(from).join(to)
  }
  return next
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const files = [
  'node_modules/react-dom/cjs/react-dom-client.production.js',
  'node_modules/react-dom/cjs/react-dom-client.development.js',
]

let wrote = 0
for (const rel of files) {
  const file = path.join(root, rel)
  if (!fs.existsSync(file)) continue
  const source = fs.readFileSync(file, 'utf8')
  const next = apply(source)
  if (next === source) continue
  fs.writeFileSync(file, next)
  wrote += 1
}

if (process.argv.includes('--verbose')) {
  console.log(`patched react-dom hoistable removeChild in ${wrote} file(s)`)
}
