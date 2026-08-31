# Branch Protection and Development Governance

## Main Branch Protection Rules

The `main` branch is protected with the following requirements to ensure code quality and security:

### 1. **Pull Request Reviews**
- All pull requests to `main` must have at least **one approval** from a repository maintainer before merging
- Code reviews must explicitly approve changes before merge is allowed
- Self-reviews do not count as approval

### 2. **Status Checks / CI Validation**
The following status checks must pass before a pull request can be merged to `main`:

- **Node.js Test Suite** (`npm test`): Core API tests, security guards, and unit tests
- **Build Validation** (`npm run build`): Application builds successfully
- **OpenAPI Contract Validation**: OpenAPI specification remains valid
- **Type Checking**: No TypeScript compilation errors (where applicable)

Required checks:
- `ABOS Core API Boundary` (`.github/workflows/abos-core-api-v1.yml`)
- Application build and test suite passes

### 3. **Dismiss Stale Reviews**
- Pull request reviews are automatically dismissed when new commits are pushed
- Reviewers must re-approve after changes are made

### 4. **Require Branches to be Up to Date**
- Branches must be up to date with `main` before merging
- Use `git merge main` or rebase to synchronize: `git fetch origin main && git rebase origin/main`

### 5. **Restrict Force Pushes**
- Force pushes to `main` are disabled
- Use standard merge commits or fast-forward-only merges

### 6. **Restrict Deletions**
- The `main` branch cannot be deleted

## Development Workflow

### Creating a Feature Branch

1. Create a feature branch from `main` with a clear, descriptive name:
   ```bash
   git fetch origin main
   git checkout -b feature/your-feature-name origin/main
   ```

2. Commit changes with clear, descriptive messages:
   ```bash
   git commit -m "feat(component): description of feature"
   ```

3. Keep commits atomic and logically grouped

### Submitting a Pull Request

1. Push your branch to the remote:
   ```bash
   git push -u origin feature/your-feature-name
   ```

2. Open a pull request to `main` through the GitHub web interface

3. Provide a clear title and description:
   - **Title**: Start with a conventional commit type (feat, fix, refactor, docs, etc.)
   - **Description**: Explain what changed and why

4. Ensure all required checks pass before requesting review

5. Request review from at least one maintainer

### Merging to Main

- Once approved and all checks pass, a maintainer will merge the PR to `main`
- Merges use **Squash and Merge** or **Create a Merge Commit** based on branch strategy
- PR is closed automatically after merge

### After Merge

- The feature branch can be safely deleted
- Changes to `main` automatically trigger deployment workflows if configured

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates
- `perf`: Performance improvements
- `security`: Security fixes or improvements

Example:
```
feat(white-label): add tenant subscription checkout

Implement Stripe-based tenant provisioning with 14-day trial period.
Includes webhook handling for automatic License and API key generation.

Closes #31
```

## Security Considerations

- **Never commit secrets** (API keys, tokens, passwords, credentials)
- Use `.gitignore` to exclude sensitive files like `.env`, `.env.local`, etc.
- All security vulnerabilities should be reported privately via GitHub's Security tab
- See `SECURITY.md` for vulnerability reporting guidelines

## Bypass Scenarios

Under exceptional circumstances, maintainers may need to bypass these rules:

- **Emergency Hotfix**: When a critical security vulnerability requires immediate patching
- **Release Blocker**: When CI infrastructure fails and blocks legitimate changes
- **Conflict Resolution**: When automated conflict resolution is the only path forward

**Bypass requires:**
1. Documented justification
2. Commit message including bypass reason
3. Post-merge notification to the team

---

**Last Updated**: 2026-08-27  
**Version**: 1.0.0
