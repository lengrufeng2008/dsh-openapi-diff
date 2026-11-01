import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { diffFiles } from '../src/diff.mjs'
import { apply } from '../plugin/index.js'
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
test('detects required/removed fields and added path', async () => {
  const r = await diffFiles(join(ROOT, 'test/fixtures/old.json'), join(ROOT, 'test/fixtures/new.json'))
  assert.equal(r.breaking.length, 3)
  assert.ok(r.changes.some((c) => c.kind === 'path-added'))
  assert.ok(r.changes.some((c) => c.kind === 'parameter-became-required'))
})
test('CLI exits 1 on breaking and plugin registers', async () => {
  const c = spawnSync(process.execPath, [join(ROOT, 'bin/dsh-openapi-diff.mjs'), join(ROOT, 'test/fixtures/old.json'), join(ROOT, 'test/fixtures/new.json')], { encoding: 'utf8' })
  assert.equal(c.status, 1)
  assert.match(c.stdout, /breaking/)
  const tools = []; let factory
  apply({ tools: { register: (t) => tools.push(t) }, skills: { registerProvider: (fn) => { factory = fn } } })
  assert.equal(tools[0].name, 'openapi_diff')
  const result = await tools[0].execute({ old: join(ROOT, 'test/fixtures/old.json'), new: join(ROOT, 'test/fixtures/new.json') })
  assert.equal(result.breaking, 3)
  assert.equal((await factory().list())[0].name, 'openapi-diff')
})
