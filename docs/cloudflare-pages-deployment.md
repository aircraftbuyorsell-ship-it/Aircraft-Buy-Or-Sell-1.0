# Cloudflare Pages deployment

This repository includes a manual GitHub Actions workflow for deploying the Vite static build to Cloudflare Pages:

- Workflow: `.github/workflows/deploy-cloudflare-pages.yml`
- Build command: `npm run build`
- Build output directory: `dist`
- Deployment command: `wrangler pages deploy dist`

## Required Cloudflare setup

Create the Cloudflare Pages project before running the workflow. In the GitHub repository settings, configure:

### Actions secrets

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token permitted to deploy Pages projects.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account that owns the Pages project.

Keep both values in GitHub Actions secrets. Do not commit them to the repository.

### Actions variable

- `CLOUDFLARE_PAGES_PROJECT_NAME` — the exact Cloudflare Pages project name.

## Deploy

1. Open **Actions** in GitHub.
2. Select **Deploy Cloudflare Pages**.
3. Choose **Run workflow**.
4. Confirm that the build and artifact verification steps pass.
5. Confirm the deployment URL in the Wrangler output.

The workflow installs dependencies with `npm ci`, builds the Vite application, verifies that `dist/index.html` exists, and only then uploads the `dist` directory.

## Application environment variables

Configure any required `VITE_*` build-time variables as GitHub Actions secrets or environment variables before deployment. Values prefixed with `VITE_` are bundled into client-side code and must never contain private credentials.

## Custom domain

Attach the production domain in the Cloudflare Pages project settings after the first successful deployment. DNS and custom-domain configuration are intentionally kept outside this repository.

## Local verification

Run the same checks locally before triggering the workflow:

```bash
npm ci
npm run build
test -f dist/index.html
```
