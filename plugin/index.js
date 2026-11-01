import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { diffFiles, renderMarkdown } from '../src/diff.mjs'
const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url))
const SKILL_PATH = join(PLUGIN_DIR, '..', 'skills', 'openapi-diff', 'SKILL.md')
const PROVIDER = 'dsh-openapi-diff'
export const name = 'openapi-diff'
export const inject = ['tools', 'skills']
function stripFrontmatter(text) { if (!text.startsWith('---\n')) return text; const end = text.indexOf('\n---\n', 4); return end === -1 ? text : text.slice(end + 5) }
const summary = { name: 'openapi-diff', description: 'Structural OpenAPI JSON breaking-change check: removed paths/methods/params/properties/responses, new required fields, type changes.', whenToUse: 'An API spec changed and a quick breaking-change gate is needed.', invocation: { modelInvocable: true, userInvocable: true }, source: 'bundled', provider: PROVIDER, resourceBase: { kind: 'directory', path: join(PLUGIN_DIR, '..', 'skills', 'openapi-diff') }, rank: 600, locator: 'openapi-diff', metadata: { domain: 'api', version: '0.1.0' } }
export function apply(ctx) {
  ctx.tools.register({ name: 'openapi_diff', description: 'Compare two OpenAPI JSON specs for structural breaking changes. Read-only; JSON only; not a full compatibility proof.', parameters: { type: 'object', additionalProperties: false, properties: { old: { type: 'string' }, new: { type: 'string' } }, required: ['old', 'new'] }, output: { schema: { type: 'object', additionalProperties: false, properties: { markdown: { type: 'string' }, breaking: { type: 'integer' }, changes: { type: 'integer' } }, required: ['markdown', 'breaking', 'changes'] }, render: (_a, v) => [{ type: 'text', text: v.markdown }] }, timeoutMs: 20_000, async execute(args = {}) { const r = await diffFiles(args.old, args.new); return { markdown: renderMarkdown(r), breaking: r.breaking.length, changes: r.changes.length } } })
  ctx.skills.registerProvider(() => ({ name: PROVIDER, async list() { return [summary] }, async get(c) { if (c?.name !== 'openapi-diff') return undefined; return { ...summary, content: stripFrontmatter(await readFile(SKILL_PATH, 'utf8')) } } }))
}
