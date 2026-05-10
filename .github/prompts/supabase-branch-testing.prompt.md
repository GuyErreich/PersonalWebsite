---
name: supabase-branch-testing
description: "Set up and use a temporary Supabase branch for localhost testing without relaxing production CORS"
---

Use the Supabase branch-testing workflow for this request: {{@prompt}}

Load the `supabase` skill before taking any action, then follow these rules:

1. Prefer Supabase MCP branch/project tools first.
2. Create a temporary branch environment for the target project.
3. Set localhost-only CORS in the branch only, never in production.
4. Use the branch project URL and anon key for local testing only.
5. Apply migrations or edge-function changes to the branch, not the parent project.
6. Validate the upload/auth/CORS flow from localhost.
7. Re-run security and performance advisors if schema or runtime behavior changed.
8. Delete the temporary branch when testing is complete.
9. If MCP coverage is missing for a branch operation, use the Supabase CLI fallback with the smallest safe scope.
10. Keep all production branch settings strict and unchanged.
