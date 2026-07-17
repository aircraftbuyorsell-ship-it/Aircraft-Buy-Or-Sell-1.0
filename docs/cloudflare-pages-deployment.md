# Cloudflare Pages deployment

This repository includes a manually triggered GitHub Actions workflow for deploying the Vite static frontend to Cloudflare Pages.

- Workflow: `.github/workflows/deploy-cloudflare-pages.yml`
- Trigger: `workflow_dispatch` only
- Build command: `npm run build`
- Build output directory: `dist`
- Deployment command: `npx --yes wrangler@4 pages deploy dist`

The frontend deployment path is intentionally separate from any future ABOS Core API Worker deployment.

## Required Cloudflare setup

Create the Cloudflare Pages project before running the workflow. Configure these values in the GitHub repository settings.

### Actions secrets

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token permitted to deploy the Pages project.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account that owns the Pages project.

Keep both values in GitHub Actions secrets. Never commit them to the repository.

### Actions variable

- `CLOUDFLARE_PAGES_PROJECT_NAME` — the exact Cloudflare Pages project name.

### GitHub environment

The deployment job uses the `production` environment. Configure required reviewers or other deployment protection rules there when production approval is required.

## Deploy

1. Open **Actions** in GitHub.
2. Select **Deploy Cloudflare Pages**.
3. Choose **Run workflow**.
4. Enter the Cloudflare Pages deployment branch. The default is `production`.
5. Confirm that configuration validation, dependency installation, build, and artifact verification pass.
6. Confirm the deployment URL in the Wrangler output.

The workflow does not run on pull requests or pushes. A deployment requires an explicit manual trigger.

## Static frontend guard

`scripts/predeploy-static-guard.sh` validates only the frontend deployment workflow. It rejects Worker deployment commands in that workflow, requires the Pages deployment command, builds the application, and verifies `dist/index.html`.

The guard does not scan or block separate ABOS Core API Worker deployment workflows.

## Application environment variables

Configure required `VITE_*` build-time variables as GitHub Actions secrets or environment variables before deployment. Values prefixed with `VITE_` are bundled into client-side code and must never contain private credentials.

## Custom domain

Attach the production domain in the Cloudflare Pages project settings after the first successful deployment. DNS and custom-domain configuration are intentionally kept outside this repository.

## Local verification

Run the same build verification locally before triggering the workflow:

```bash
npm ci
bash scripts/predeploy-static-guard.sh
```
