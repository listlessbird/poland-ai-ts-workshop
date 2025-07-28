Problem: our system doesn't update previous memories.

Solution: copy a setup from Mastra where we use a

Mastra:

```ts
type UpdateReason =
  | `append-new-memory`
  | 'clarify-existing-memory'
  | 'replace-irrelevant-memory';
```
