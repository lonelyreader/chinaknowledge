import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const registryRelative = 'docs/product-feature-registry.md'
const registryFile = path.join(root, registryRelative)

const watchedEntries = [
  '.github/workflows',
  'DESIGN.md',
  'apps/web/.env.example',
  'apps/web/.env.preview.example',
  'apps/web/.env.production.example',
  'apps/web/compose.yaml',
  'apps/web/public',
  'apps/web/scripts',
  'apps/web/src',
  'apps/web/tests',
  'apps/web/next.config.ts',
  'apps/web/package-lock.json',
  'apps/web/package.json',
  'apps/web/vercel.json',
  'docs/current-state.md',
  'docs/decisions',
  'docs/operational-publishing-requirements.md',
  'docs/product-brief.md',
  'package.json',
  'scripts',
]

const ignoredNames = new Set(['.DS_Store', 'node_modules', '.next'])

function walk(target) {
  if (!fs.existsSync(target)) return []
  const stat = fs.statSync(target)
  if (stat.isFile()) return [target]
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredNames.has(entry.name)) return []
    return walk(path.join(target, entry.name))
  })
}

function implementationFiles() {
  return watchedEntries
    .flatMap((entry) => walk(path.join(root, entry)))
    .filter((file) => path.resolve(file) !== path.resolve(registryFile))
    .sort((left, right) => left.localeCompare(right))
}

function fingerprint(files) {
  const hash = crypto.createHash('sha256')
  for (const file of files) {
    const relative = path.relative(root, file).split(path.sep).join('/')
    hash.update(relative)
    hash.update('\0')
    hash.update(fs.readFileSync(file))
    hash.update('\0')
  }
  return `sha256:${hash.digest('hex')}`
}

function fail(message) {
  console.error(`Feature registry check failed: ${message}`)
  process.exit(1)
}

if (!fs.existsSync(registryFile)) fail(`${registryRelative} is missing.`)

const files = implementationFiles()
const actual = fingerprint(files)
const source = fs.readFileSync(registryFile, 'utf8')
const match = source.match(/^implementation_fingerprint:\s*(sha256:[a-f\d]{64}|pending)$/m)
if (!match) fail('implementation_fingerprint is missing or invalid.')

if (process.argv.includes('--update')) {
  const updated = source.replace(
    /^implementation_fingerprint:\s*(sha256:[a-f\d]{64}|pending)$/m,
    `implementation_fingerprint: ${actual}`,
  )
  fs.writeFileSync(registryFile, updated)
  console.log(`Feature registry fingerprint updated from ${files.length} implementation files.`)
  process.exit(0)
}

if (match[1] !== actual) {
  fail(
    'implementation facts changed. Review the affected user capabilities in ' +
    `${registryRelative}, then run "npm run feature-registry:update" and commit both changes.`,
  )
}

const requiredHeadings = [
  '## 访客与读者（无需登录）',
  '## Member（铲子计划成员）',
  '## Editor（站方编辑）',
  '## Super Admin（超级管理员）',
  '## 运营与维护',
  '## 当前明确不提供',
  '## 同步门禁',
]
for (const heading of requiredHeadings) {
  if (!source.includes(heading)) fail(`required section "${heading}" is missing.`)
}

for (const prefix of ['RDR', 'MEM', 'EDT', 'ADM', 'OPS']) {
  if (!new RegExp(`\\| ${prefix}-\\d{2} \\|`).test(source)) {
    fail(`no capabilities are registered for ${prefix}.`)
  }
}

console.log(`Feature registry PASS: ${files.length} implementation files match ${match[1]}.`)
