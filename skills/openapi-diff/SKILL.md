---
name: openapi-diff
description: Structural OpenAPI JSON breaking-change check. Use before merging an API spec change; JSON only and not a full compatibility proof.
whenToUse: "An OpenAPI JSON file changed and a quick breaking-change gate is needed."
---

# OpenAPI diff

```text
Use openapi_diff with old=old.json new=new.json.
```

Flags:

- removed path, method, parameter, response, or response property
- parameter that became required
- new required request body or property
- type change

## Limits

- JSON only (no YAML).
- Structural subset; no `$ref` resolution, oneOf/allOf semantics, auth, or behavioral compatibility.
- New required fields are breaking only when the diff can see the schema.
- A clean diff is not an API compatibility proof.
