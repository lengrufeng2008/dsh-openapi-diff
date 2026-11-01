# OpenAPI Diff for DSH

> Structural OpenAPI **JSON** breaking-change check: removed paths/methods/params/properties/responses,
> new required fields, parameter-became-required, type changes.

## Use

```bash
node bin/dsh-openapi-diff.mjs old.json new.json
node bin/dsh-openapi-diff.mjs old.json new.json --json
```

In DSH:

```text
Use openapi_diff with old=old.json new=new.json.
```

## Limits

- JSON only
- Structural subset; no full `$ref` resolution or oneOf/allOf semantics
- Not a behavioral compatibility test or contract test
- A clean result is not a compatibility proof

## Tests

```bash
npm test
```

## Provenance

A small independent structural diff. License: MIT.
