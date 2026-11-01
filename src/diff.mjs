import { readFile } from 'node:fs/promises'
const METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace']
function list(value) { return Array.isArray(value) ? value : [] }
function schemaType(schema) { if (!schema) return 'unknown'; if (schema.type) return schema.type; if (schema.$ref) return schema.$ref; return 'schema' }
function compareSchema(oldSchema, newSchema, where, changes) {
  if (!oldSchema || !newSchema) return
  const oldType = schemaType(oldSchema), newType = schemaType(newSchema)
  if (oldType !== newType) changes.push({ severity: 'breaking', kind: 'type-changed', where, before: oldType, after: newType })
  const oldProps = oldSchema.properties || {}, newProps = newSchema.properties || {}
  for (const key of Object.keys(oldProps)) if (!(key in newProps)) changes.push({ severity: 'breaking', kind: 'property-removed', where: `${where}.${key}` })
  for (const key of Object.keys(newProps)) if (!(key in oldProps)) changes.push({ severity: 'info', kind: 'property-added', where: `${where}.${key}` })
  const oldReq = new Set(list(oldSchema.required)), newReq = new Set(list(newSchema.required))
  for (const key of oldReq) if (!newReq.has(key)) changes.push({ severity: 'compatible', kind: 'required-relaxed', where: `${where}.${key}` })
  for (const key of newReq) if (!oldReq.has(key)) changes.push({ severity: 'breaking', kind: 'required-added', where: `${where}.${key}` })
}
export function diffSpecs(oldSpec, newSpec) {
  const changes = []
  const oldPaths = oldSpec.paths || {}, newPaths = newSpec.paths || {}
  for (const path of Object.keys(oldPaths)) if (!(path in newPaths)) changes.push({ severity: 'breaking', kind: 'path-removed', where: path })
  for (const path of Object.keys(newPaths)) if (!(path in oldPaths)) changes.push({ severity: 'info', kind: 'path-added', where: path })
  for (const path of Object.keys(oldPaths)) {
    if (!(path in newPaths)) continue
    for (const method of METHODS) {
      const a = oldPaths[path][method], b = newPaths[path][method]
      if (a && !b) { changes.push({ severity: 'breaking', kind: 'method-removed', where: `${method.toUpperCase()} ${path}` }); continue }
      if (!a || !b) { if (!a && b) changes.push({ severity: 'info', kind: 'method-added', where: `${method.toUpperCase()} ${path}` }); continue }
      const oldParams = list(a.parameters), newParams = list(b.parameters)
      const oldNames = new Set(oldParams.map((p) => `${p.in}:${p.name}`)), newNames = new Set(newParams.map((p) => `${p.in}:${p.name}`))
      for (const key of oldNames) if (!newNames.has(key)) changes.push({ severity: 'breaking', kind: 'parameter-removed', where: `${method.toUpperCase()} ${path} ${key}` })
      for (const p of newParams) {
        const key = `${p.in}:${p.name}`
        const oldParam = oldParams.find((x) => `${x.in}:${x.name}` === key)
        if (!oldParam) changes.push({ severity: p.required ? 'breaking' : 'info', kind: 'parameter-added', where: `${method.toUpperCase()} ${path} ${key}` })
        else if (!oldParam.required && p.required) changes.push({ severity: 'breaking', kind: 'parameter-became-required', where: `${method.toUpperCase()} ${path} ${key}` })
      }
      if (!a.requestBody && b.requestBody?.required) changes.push({ severity: 'breaking', kind: 'required-request-body-added', where: `${method.toUpperCase()} ${path}` })
      const oldResponses = a.responses || {}, newResponses = b.responses || {}
      for (const code of Object.keys(oldResponses)) if (!(code in newResponses)) changes.push({ severity: 'breaking', kind: 'response-removed', where: `${method.toUpperCase()} ${path} ${code}` })
      for (const code of Object.keys(oldResponses)) if (code in newResponses) {
        const os = oldResponses[code]?.content?.['application/json']?.schema
        const ns = newResponses[code]?.content?.['application/json']?.schema
        compareSchema(os, ns, `${method.toUpperCase()} ${path} ${code}`, changes)
      }
    }
  }
  return { breaking: changes.filter((c) => c.severity === 'breaking'), changes }
}
export async function diffFiles(oldPath, newPath) {
  const read = async (p) => { try { return JSON.parse(await readFile(p, 'utf8')) } catch (e) { throw new Error(`cannot read JSON spec ${p}: ${e.message}`) } }
  return diffSpecs(await read(oldPath), await read(newPath))
}
export function renderMarkdown(report) {
  const lines = [`# OpenAPI diff: ${report.breaking.length} breaking, ${report.changes.length} total`, '']
  if (!report.changes.length) lines.push('No changes.')
  else {
    lines.push('| Severity | Kind | Where | Before | After |', '| --- | --- | --- | --- | --- |')
    for (const c of report.changes) lines.push(`| ${c.severity} | ${c.kind} | ${c.where} | ${c.before || ''} | ${c.after || ''} |`)
  }
  lines.push('', 'JSON OpenAPI only; structural subset; not a full compatibility proof.')
  return lines.join('\n')
}
