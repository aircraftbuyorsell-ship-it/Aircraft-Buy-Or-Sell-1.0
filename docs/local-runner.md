# Local GitHub Actions runner

This branch includes a manual-only workflow at `.github/workflows/abos-core-api-v1-self-hosted.yml`.

Register a dedicated, isolated Windows runner in the repository settings with these labels:

- `self-hosted`
- `windows`
- `x64`
- `abos`

The runner should be a disposable or dedicated service account with no production credentials, no Cloudflare token, no Stripe secret, and no Supabase service-role key. Keep outbound network access limited to GitHub and the package registry required for CI. Do not use a developer workstation that contains production secrets.

Registration requires a short-lived runner token generated in GitHub repository settings. Never commit that token or place it in workflow YAML. After registration, start the workflow manually from the Actions tab. The workflow is not triggered by pushes or pull requests, so adding a runner cannot trigger an unexpected deployment.

If the runner host is compromised, remove it from GitHub immediately and rotate any credentials that were present on the host. This scaffold does not register, start, or configure a runner on a local machine.
