# 8. GIT WORKFLOW & VERSION CONTROL

## 8.1. Branching Strategy
We follow a simplified **Gitflow** or **Feature Branch Workflow**.

* **`main`**: Production-ready code. Stable.
* **`develop`**: Integration branch. All features merge here for testing.
* **`feat/<feature-name>`**: New features (e.g., `feat/shuttle-3d-model`).
* **`fix/<bug-name>`**: Bug fixes (e.g., `fix/connection-timeout`).
* **`docs/<topic>`**: Documentation updates.

## 8.2. Commit Message Convention
We adhere strictly to **Conventional Commits** to automate changelogs.

**Format:** `<type>(<scope>): <subject>`

### Types:
* **feat**: A new feature.
* **fix**: A bug fix.
* **docs**: Documentation only changes.
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
* **refactor**: A code change that neither fixes a bug nor adds a feature.
* **perf**: A code change that improves performance.
* **chore**: Changes to the build process or auxiliary tools and libraries (e.g., updating dependencies).

### Examples:
* ✅ `feat(dashboard): add 3d visualization for lifter`
* ✅ `fix(plc): resolve timeout issue with S7-1200`
* ✅ `style(ui): update color palette to match design system`
* ❌ `update code` (Too vague)
* ❌ `fix bug` (Which bug?)

## 8.3. Pull Request (PR) Process
1.  **Self-Review:** Developer must review their own code before creating a PR.
2.  **No Direct Push:** Direct push to `main` or `develop` is blocked.
3.  **Reviewers:** At least 1 peer approval is required to merge.
4.  **CI/CD:** Ensure the build passes and Linter checks succeed before merging.