#!/usr/bin/env node
import { diffFiles, renderMarkdown } from '../src/diff.mjs'
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) { console.log('dsh-openapi-diff <old.json> <new.json> [--json]\\n\\nStructural OpenAPI breaking-change check (JSON only).'); process.exit(0) }
const files = args.filter((a) => !a.startsWith('--'))
if (files.length < 2) { console.error('dsh-openapi-diff: two JSON specs required'); process.exit(2) }
try {
  const r = await diffFiles(files[0], files[1])
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 2))
  else console.log(renderMarkdown(r))
  process.exitCode = r.breaking.length ? 1 : 0
} catch (error) { console.error(`dsh-openapi-diff: ${error.message}`); process.exitCode = 2 }
