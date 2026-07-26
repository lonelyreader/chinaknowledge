import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const docsRoot = path.join(root, 'docs')
const failures = []

const allowed = {
  doc_type: new Set([
    'router',
    'product',
    'current',
    'contract',
    'checklist',
    'decision',
    'reference',
    'archive',
  ]),
  authority: new Set([
    'routing',
    'canonical',
    'execution',
    'evidence',
    'historical',
  ]),
  status: new Set([
    'active',
    'deferred',
    'completed',
    'superseded',
    'accepted',
  ]),
}

const typeBudgets = {
  router: 120,
  product: 500,
  current: 200,
  contract: 400,
  checklist: 320,
  decision: 200,
  reference: 240,
  archive: 240,
}

const authorityByType = {
  router: 'routing',
  product: 'canonical',
  current: 'canonical',
  contract: 'canonical',
  checklist: 'execution',
  decision: 'canonical',
  reference: 'evidence',
  archive: 'historical',
}

const rootBudgets = new Map([
  ['AGENTS.md', { lines: 80, bytes: 3072 }],
  ['README.md', { lines: 180, bytes: 14000 }],
  ['DESIGN.md', { lines: 220, bytes: 16000 }],
])

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/')
}

function walkMarkdown(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(directory, entry.name)
      if (entry.isDirectory()) return walkMarkdown(target)
      return entry.isFile() && entry.name.endsWith('.md') ? [target] : []
    })
}

function parseFrontmatter(file, source) {
  const lines = source.split(/\r?\n/)
  if (lines[0] !== '---') {
    failures.push(`${relative(file)}: missing DocContractV1 frontmatter`)
    return {}
  }

  const closing = lines.indexOf('---', 1)
  if (closing === -1) {
    failures.push(`${relative(file)}: unclosed frontmatter`)
    return {}
  }

  const metadata = {}
  for (const line of lines.slice(1, closing)) {
    if (!line.trim()) continue
    const match = line.match(/^([a-z_]+):\s*(.+)$/)
    if (!match) {
      failures.push(`${relative(file)}: unsupported frontmatter line "${line}"`)
      continue
    }
    metadata[match[1]] = match[2].trim()
  }

  return metadata
}

function localMarkdownLinks(file, source) {
  const links = []
  const pattern = /\[[^\]]*]\(([^)]+)\)/g
  for (const match of source.matchAll(pattern)) {
    const raw = match[1].trim()
    if (
      !raw ||
      raw.startsWith('#') ||
      raw.startsWith('http://') ||
      raw.startsWith('https://') ||
      raw.startsWith('mailto:')
    ) {
      continue
    }

    const withoutAnchor = raw.split('#')[0]
    if (!withoutAnchor) continue
    links.push(path.resolve(path.dirname(file), withoutAnchor))
  }
  return links
}

function registeredTargets(routerFile, source) {
  return new Set(localMarkdownLinks(routerFile, source).map((target) => path.normalize(target)))
}

function requireMounted(directory, routerName = 'README.md') {
  const routerFile = path.join(directory, routerName)
  if (!fs.existsSync(routerFile)) {
    failures.push(`${relative(routerFile)}: missing directory router`)
    return
  }

  const source = fs.readFileSync(routerFile, 'utf8')
  const mounted = registeredTargets(routerFile, source)
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== routerName) {
      if (!mounted.has(path.normalize(target))) {
        failures.push(`${relative(target)}: not mounted by ${relative(routerFile)}`)
      }
    }
    if (entry.isDirectory()) {
      const childRouter = path.join(target, 'README.md')
      if (fs.existsSync(childRouter) && !mounted.has(path.normalize(childRouter))) {
        failures.push(`${relative(childRouter)}: not mounted by ${relative(routerFile)}`)
      }
    }
  }
}

for (const [fileName, budget] of rootBudgets) {
  const file = path.join(root, fileName)
  if (!fs.existsSync(file)) {
    failures.push(`${fileName}: required root document is missing`)
    continue
  }
  const source = fs.readFileSync(file, 'utf8')
  const count = source.split(/\r?\n/).length
  const bytes = Buffer.byteLength(source)
  if (count > budget.lines) {
    failures.push(`${fileName}: ${count} lines exceeds root budget ${budget.lines}`)
  }
  if (bytes > budget.bytes) {
    failures.push(`${fileName}: ${bytes} bytes exceeds root budget ${budget.bytes}`)
  }
  for (const target of localMarkdownLinks(file, source)) {
    if (!fs.existsSync(target)) {
      failures.push(`${fileName}: broken local link to ${relative(target)}`)
    }
  }
}

const agentsSource = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8')
const forbiddenAgentState = [
  [/\bP\d+\b/, 'phase identifier such as P0 or P1'],
  [/当前阶段|下一阶段|当前执行线|当前任务 ID|计划应用/, 'mutable project state'],
]
for (const [pattern, label] of forbiddenAgentState) {
  if (pattern.test(agentsSource)) {
    failures.push(`AGENTS.md: router must not contain ${label}`)
  }
}

const stableEntryRules = new Map([
  ['README.md', [/\bP\d+\b/, /当前阶段|下一阶段|当前执行线/]],
  ['DESIGN.md', [/\bP\d+\b/, /当前阶段|下一阶段|当前执行线/]],
  ['apps/README.md', [/\bP\d+\b/, /当前只计划|尚未创建|当前阶段|下一阶段/]],
  ['packages/README.md', [/\bP\d+\b/, /当前只有|当前阶段|下一阶段/]],
])
for (const [fileName, patterns] of stableEntryRules) {
  const source = fs.readFileSync(path.join(root, fileName), 'utf8')
  for (const pattern of patterns) {
    if (pattern.test(source)) {
      failures.push(`${fileName}: stable entry contains mutable phase or execution state`)
    }
  }
}

const canonicalScopes = new Map()
const docRecords = []

for (const file of walkMarkdown(docsRoot)) {
  const source = fs.readFileSync(file, 'utf8')
  const lines = source.split(/\r?\n/)
  const metadata = parseFrontmatter(file, source)
  const required = [
    'doc_contract',
    'doc_type',
    'authority',
    'status',
    'scope',
    'last_verified',
    'max_lines',
  ]

  for (const key of required) {
    if (!metadata[key]) failures.push(`${relative(file)}: missing ${key}`)
  }

  if (metadata.doc_contract && metadata.doc_contract !== 'DocContractV1') {
    failures.push(`${relative(file)}: unsupported doc_contract ${metadata.doc_contract}`)
  }

  for (const key of ['doc_type', 'authority', 'status']) {
    if (metadata[key] && !allowed[key].has(metadata[key])) {
      failures.push(`${relative(file)}: invalid ${key} ${metadata[key]}`)
    }
  }

  const expectedAuthority = authorityByType[metadata.doc_type]
  if (expectedAuthority && metadata.authority !== expectedAuthority) {
    failures.push(
      `${relative(file)}: ${metadata.doc_type} must use authority ${expectedAuthority}`,
    )
  }

  if (
    metadata.last_verified &&
    !/^\d{4}-\d{2}-\d{2}$/.test(metadata.last_verified)
  ) {
    failures.push(`${relative(file)}: last_verified must be YYYY-MM-DD`)
  }

  const maxLines = Number(metadata.max_lines)
  if (!Number.isInteger(maxLines) || maxLines <= 0) {
    failures.push(`${relative(file)}: max_lines must be a positive integer`)
  } else {
    if (lines.length > maxLines) {
      failures.push(
        `${relative(file)}: ${lines.length} lines exceeds declared budget ${maxLines}`,
      )
    }
    const typeLimit = typeBudgets[metadata.doc_type]
    if (typeLimit && maxLines > typeLimit) {
      failures.push(
        `${relative(file)}: declared budget ${maxLines} exceeds ${metadata.doc_type} limit ${typeLimit}`,
      )
    }
  }

  if (metadata.doc_type === 'router' && /^\s*[-*]\s+\[[ xX]\]/m.test(source)) {
    failures.push(`${relative(file)}: router must not contain checklist items`)
  }
  if (metadata.doc_type === 'router' && Buffer.byteLength(source) > 5000) {
    failures.push(`${relative(file)}: router exceeds 5000-byte payload budget`)
  }

  if (metadata.authority === 'canonical' && metadata.scope) {
    const existing = canonicalScopes.get(metadata.scope)
    if (existing) {
      failures.push(
        `${relative(file)}: canonical scope "${metadata.scope}" already owned by ${existing}`,
      )
    } else {
      canonicalScopes.set(metadata.scope, relative(file))
    }
  }

  for (const target of localMarkdownLinks(file, source)) {
    if (!fs.existsSync(target)) {
      failures.push(`${relative(file)}: broken local link to ${relative(target)}`)
    }
  }

  if (metadata.doc_type === 'checklist' && metadata.status === 'active') {
    for (const key of [
      'change_id',
      'risk_tier',
      'validation_profile',
      'allowed_paths',
      'approval_gates',
    ]) {
      if (!metadata[key]) failures.push(`${relative(file)}: active checklist missing ${key}`)
    }
    if (metadata.risk_tier && !['base', 'upgraded'].includes(metadata.risk_tier)) {
      failures.push(`${relative(file)}: invalid risk_tier ${metadata.risk_tier}`)
    }
    if (
      metadata.validation_profile &&
      !['slice', 'work_item', 'phase_release'].includes(metadata.validation_profile)
    ) {
      failures.push(
        `${relative(file)}: invalid validation_profile ${metadata.validation_profile}`,
      )
    }
    if (metadata.allowed_paths) {
      const patterns = metadata.allowed_paths.split(',').map((value) => value.trim())
      for (const pattern of patterns) {
        if (
          !pattern ||
          path.isAbsolute(pattern) ||
          pattern === '**' ||
          pattern.includes('..')
        ) {
          failures.push(`${relative(file)}: unsafe allowed_paths entry "${pattern}"`)
        }
      }
    }
    for (const heading of [
      '## Scope',
      '## No-go',
      '## Acceptance',
      '## Validation',
      '## Writeback',
    ]) {
      if (!source.includes(heading)) {
        failures.push(`${relative(file)}: active checklist missing heading "${heading}"`)
      }
    }
  }

  if (
    metadata.doc_type === 'product' &&
    (/\bP\d+\b/.test(source) || /当前阶段|当前结论/.test(source))
  ) {
    failures.push(
      `${relative(file)}: product definition must not contain phase execution state`,
    )
  }

  docRecords.push({ file, metadata, source })
}

function walkDirectories(directory) {
  const directories = [directory]
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      directories.push(...walkDirectories(path.join(directory, entry.name)))
    }
  }
  return directories
}

for (const directory of walkDirectories(docsRoot)) {
  const markdown = fs
    .readdirSync(directory, { withFileTypes: true })
    .some((entry) => entry.isFile() && entry.name.endsWith('.md'))
  if (!markdown) continue
  requireMounted(directory)
}

if (failures.length) {
  console.error(`Documentation governance failed with ${failures.length} issue(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `Documentation governance PASS: ${docRecords.length} docs, ${canonicalScopes.size} canonical scopes.`,
)
