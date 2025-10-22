The repository builds JSON output from JSONC source files and serves static HTML/snippets for event shows and hotel/shuttle data.

Key locations
- `shows/` - source show content in JSONC and HTML snippets (e.g. `shows/abc/abc-content.jsonc`, `shows/*/flight-info/*`)
- `config/` - canonical site configuration and generated `config/show-content/` (build output)
- `global/` - shared snippets and assets (e.g. `global/style.less`, `global/asset-links/`)
- `.github/workflows/jsonc-build.yml` - CI job that converts `.jsonc` -> `.json` into `config/show-content`

Big picture
- Source of truth: maintain editable JSONC files in `shows/` and `config/` (commented JSON allowed).
- Build process: GitHub Actions runs `strip-json-comments` to create cleaned `.json` under `config/show-content/` and commits them back to the branch.
- Consumers: site pages and snippets reference `config/show-content/*.json` and HTML snippets under `shows/*/` and `global/snippets/`.

Project-specific conventions (examples)
- JSONC used as the editable format. Example: `shows/abc/abc-content.jsonc` contains nested `routes`, `stops`, `wait-time` URLs and references to `config/show-content/*` for hotels and schedules.
- Preserve folder structure when referencing generated JSON. CI writes outputs to `config/show-content/<original-path>.json`.
- Special route keys: `w` is used for walking-distance hotels, `x` for placeholder/non-service hotels (see `shows/abc/abc-content.jsonc`).
- External integrations: Google Maps embeds and Google Apps Script URLs are stored directly in JSONC (`wait-time` fields point to Apps Script endpoints).

Developer workflows & commands
- Editing content: modify `.jsonc` files under `shows/` or `config/`. Commit to a branch (e.g., `test`) and push. CI will generate cleaned JSON automatically.
- Rebuild locally: install Node 18 and `strip-json-comments-cli`, then run the same conversion loop as the workflow. Example (PowerShell):

  npm install -g strip-json-comments-cli; mkdir -Force config/show-content; Get-ChildItem -Recurse -Filter '*.jsonc' -Path shows,config | ForEach-Object { $file=$_; $relative = $file.FullName -replace '^[^\\]+\\',''; $out = Join-Path 'config/show-content' $relative; $out = [IO.Path]::ChangeExtension($out,'.json'); New-Item -ItemType Directory -Force -Path (Split-Path $out); strip-json-comments $file.FullName > $out }

Important files to inspect when making changes
- Workflows: `.github/workflows/jsonc-build.yml` - controls generation and commit of `.json` files.
- Example content: `shows/abc/abc-content.jsonc`, `shows/pstm/pstm-content.jsonc`.
- Global shared snippets: `global/snippets/`, `global/asset-links/`.

Errors and edge cases to watch for
- CI force-pushes generated JSON to the same branch; avoid committing generated files manually unless intended. The workflow uses a forced push.
- Ensure JSONC keys pointing to generated JSON use the `config/show-content/...` path shape. If you rename/move files, update references.
- When adding external URLs (Maps, Apps Script) keep them as full URLs in JSONC; these are consumed directly by front-end snippets.

If unsure
- Read `shows/*/*.jsonc` and the JSON output under `config/show-content/` to confirm expected shapes.
- For content-loading logic, check HTML snippets under `shows/*/flight-info` and `global/snippets/` to see how fields are used.

Ask the human reviewer if any runtime server processes or deployment steps should be recorded here (none are present in repo files). 
