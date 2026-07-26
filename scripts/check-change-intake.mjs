import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const checklistRoot = path.join(root, 'docs', 'roadmap', 'checklists')
const failures = []

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    const detail = error.stderr?.trim() || error.message
    failures.push(`git ${args.join(' ')} failed: ${detail}`)
    return ''
  }
}

function parseFrontmatterSource(source) {
  const lines = source.split(/\r?\n/)
  if (lines[0] !== '---') return {}
  const closing = lines.indexOf('---', 1)
  if (closing === -1) return {}

  const metadata = {}
  for (const line of lines.slice(1, closing)) {
    const match = line.match(/^([a-z_]+):\s*(.+)$/)
    if (match) metadata[match[1]] = match[2].trim()
  }
  return metadata
}

function parseFrontmatter(file) {
  return parseFrontmatterSource(fs.readFileSync(file, 'utf8'))
}

function existsInHead(relativePath) {
  try {
    execFileSync('git', ['cat-file', '-e', `HEAD:${relativePath}`], {
      cwd: root,
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

function readFromHead(relativePath) {
  return execFileSync('git', ['show', `HEAD:${relativePath}`], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function listHeadChecklists() {
  try {
    return execFileSync(
      'git',
      ['ls-tree', '-r', '--name-only', 'HEAD', 'docs/roadmap/checklists'],
      {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
      .split(/\r?\n/)
      .filter((file) => file.endsWith('.md') && !file.endsWith('/README.md'))
  } catch {
    return []
  }
}

function normalize(value) {
  return value.replaceAll('\\', '/').replace(/^\.\/+/, '')
}

function matches(file, pattern) {
  const normalizedFile = normalize(file)
  const normalizedPattern = normalize(pattern)
  if (normalizedPattern.endsWith('/**')) {
    const directory = normalizedPattern.slice(0, -3)
    return normalizedFile === directory || normalizedFile.startsWith(`${directory}/`)
  }
  return normalizedFile === normalizedPattern
}

const active = fs
  .readdirSync(checklistRoot, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md')
  .map((entry) => {
    const file = path.join(checklistRoot, entry.name)
    return { file, metadata: parseFrontmatter(file) }
  })
  .filter(({ metadata }) => metadata.status === 'active')

const baselineInHead = existsInHead('scripts/check-change-intake.mjs')
const contracts = []

/*
 * A normal diff is authorized by contracts that were already active in HEAD.
 * This also lets an active contract authorize its own completion and move to
 * archive. A checklist added in the current diff cannot retroactively cover
 * implementation in that same diff.
 */
if (baselineInHead) {
  for (const relativeFile of listHeadChecklists()) {
    const contractMetadata = parseFrontmatterSource(readFromHead(relativeFile))
    if (contractMetadata.status !== 'active') continue

    const allowedPaths = (contractMetadata.allowed_paths || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    contracts.push({
      changeId: contractMetadata.change_id || path.basename(relativeFile),
      allowedPaths,
    })
  }
} else {
  for (const { file, metadata } of active) {
    if (metadata.bootstrap !== 'true') continue
    const allowedPaths = (metadata.allowed_paths || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    contracts.push({
      changeId: metadata.change_id || path.basename(file),
      allowedPaths,
    })
  }
}

for (const { file, metadata } of active) {
  const relativeFile = normalize(path.relative(root, file))
  if (baselineInHead && metadata.bootstrap === 'true') {
    failures.push(
      `${relativeFile}: bootstrap is only valid before the first governance baseline`,
    )
  }
}

for (const { file, metadata } of active) {
  const relativeFile = normalize(path.relative(root, file))
  const allowedPaths = (metadata.allowed_paths || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  if (!metadata.change_id) {
    failures.push(`${relativeFile}: active checklist missing change_id`)
  }
  if (!allowedPaths.length) {
    failures.push(`${relativeFile}: active checklist missing allowed_paths`)
  }
}

const tracked = git(['diff', '--name-only', 'HEAD'])
const untracked = git(['ls-files', '--others', '--exclude-standard'])
const changedPaths = [...new Set(`${tracked}\n${untracked}`.split(/\r?\n/).filter(Boolean))]
  .map(normalize)
  .sort()

const uncovered = changedPaths.filter(
  (file) =>
    !contracts.some(({ allowedPaths }) =>
      allowedPaths.some((pattern) => matches(file, pattern)),
    ),
)

if (uncovered.length) {
  failures.push(
    `changed paths without active checklist coverage:\n${uncovered
      .map((file) => `  - ${file}`)
      .join('\n')}`,
  )
}

if (failures.length) {
  console.error(`Change intake failed with ${failures.length} issue(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

const contractSummary = contracts
  .map(({ changeId, allowedPaths }) => `${changeId} (${allowedPaths.length} path rules)`)
  .join(', ')
console.log(
  `Change intake PASS: ${changedPaths.length} changed paths covered by ${contractSummary}.`,
)
