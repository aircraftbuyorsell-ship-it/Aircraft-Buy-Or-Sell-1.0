# Branch Protection Setup Guide

This guide explains how to configure GitHub branch protection rules for the `main` branch as documented in `GOVERNANCE.md`.

## Prerequisites

- Repository administrator access
- GitHub CLI (optional but recommended), or access to GitHub web interface

## Configuration Overview

The `main` branch requires the following protection rules:

1. **Pull Request Reviews**: Require 1 approval before merging
2. **Status Checks**: All CI checks must pass
3. **Dismiss Stale Reviews**: Automatically dismiss reviews when new commits are pushed
4. **Require Up-to-Date Branches**: Branches must be up to date before merging
5. **Restrict Force Pushes**: Force pushes disabled
6. **Restrict Deletions**: Branch cannot be deleted

---

## Method 1: GitHub Web Interface (Recommended for Most Users)

### Step 1: Navigate to Branch Protection Settings

1. Go to the repository: https://github.com/aircraftbuyorsell-ship-it/Aircraft-Buy-Or-Sell-1.0
2. Click **Settings** tab
3. In the left sidebar, click **Branches**
4. Under "Branch protection rules", click **Add rule**

### Step 2: Configure the Rule

In the "Branch name pattern" field, enter: `main`

### Step 3: Enable Required Settings

#### 1. Require a pull request before merging
- [x] **Require pull request reviews before merging**
  - Number of approvals required: `1`
  - [ ] Require review from code owners (optional, only if CODEOWNERS file exists)
  - [x] **Dismiss stale pull request approvals when new commits are pushed**
  - [ ] Require approval of the latest commit (recommended for extra safety)

#### 2. Require status checks to pass before merging
- [x] **Require status checks to pass before merging**
- [x] **Require branches to be up to date before merging**

Require the following status checks to pass (search and select each):
- `ABOS Core API Boundary` (from `.github/workflows/abos-core-api-v1.yml`)
- Any other CI checks configured for the repository (e.g., `build`, `test`, `lint`)

#### 3. Restrict who can push to matching branches (Optional but Recommended)
- [x] **Restrict who can push to matching branches**
  - Select: Administrators only (or specify teams/users)

#### 4. Prevent force pushes
- [x] **Allow force pushes**
  - Select: **Do not allow force pushes**

#### 5. Allow deletions
- [x] **Allow deletions**
  - Select: **Do not allow deletions**

### Step 4: Save

Click **Create** to save the branch protection rule.

---

## Method 2: GitHub CLI (For Automation)

If you have GitHub CLI installed, you can configure branch protection via the command line:

```bash
# Install GitHub CLI if needed (https://cli.github.com)

# Authenticate with GitHub
gh auth login

# Configure branch protection for the repository
# Replace OWNER/REPO with your repository

OWNER="aircraftbuyorsell-ship-it"
REPO="Aircraft-Buy-Or-Sell-1.0"

# Enable protection
gh api repos/${OWNER}/${REPO}/branches/main/protection \
  --method PUT \
  -f required_pull_request_reviews='{"required_approving_review_count": 1, "dismiss_stale_reviews": true}' \
  -f required_status_checks='{"strict": true, "contexts": ["ABOS Core API Boundary"]}' \
  -f enforce_admins=false \
  -f allow_force_pushes=false \
  -f allow_deletions=false \
  -f restrict_who_can_push=false
```

---

## Method 3: Terraform (For Infrastructure-as-Code)

If managing GitHub infrastructure with Terraform, use the `github_branch_protection` resource:

```hcl
resource "github_branch_protection" "main" {
  repository_id           = "Aircraft-Buy-Or-Sell-1.0"
  pattern                 = "main"
  enforce_admins          = false
  require_signed_commits  = false

  required_pull_request_reviews {
    required_approving_review_count = 1
    dismiss_stale_reviews           = true
  }

  required_status_checks {
    strict   = true
    contexts = ["ABOS Core API Boundary"]
  }

  force_push_bypassers = []
  allows_deletions     = false
  allows_force_pushes  = false
}
```

---

## Verification

### Using the Verification Script

```bash
# Run the verification script
./scripts/verify-branch-protection.sh aircraftbuyorsell-ship-it Aircraft-Buy-Or-Sell-1.0

# Or with GITHUB_TOKEN environment variable
export GITHUB_TOKEN=your_github_token_here
./scripts/verify-branch-protection.sh aircraftbuyorsell-ship-it Aircraft-Buy-Or-Sell-1.0
```

### Using GitHub CLI

```bash
# Check current protection rules
gh api repos/aircraftbuyorsell-ship-it/Aircraft-Buy-Or-Sell-1.0/branches/main/protection
```

### Using the GitHub Web Interface

1. Go to Settings → Branches
2. Under "Branch protection rules", you should see "main" listed with a green checkmark
3. Click on the rule to view/edit details

---

## Troubleshooting

### "Status check not found" error

This means the required status check (e.g., "ABOS Core API Boundary") hasn't run yet. To fix:

1. Make a push to a feature branch
2. Let the CI workflow run and complete
3. Try configuring the branch protection rule again - the status check should now be available

### "403 Forbidden" error

You need administrator access to the repository. Ask the repository owner to configure this, or ensure your GitHub token has `admin:repo_hook` scope.

### Rule not showing up

GitHub may take a few seconds to process the change. Refresh the page or try again.

---

## Related Documentation

- **GOVERNANCE.md** - Branch protection policy documentation
- **scripts/verify-branch-protection.sh** - Verification script
- **GitHub Documentation**: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule

---

**Last Updated**: 2026-08-27  
**Version**: 1.0.0
