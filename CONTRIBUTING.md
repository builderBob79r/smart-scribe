# Contributing to Smart Scribe

Thank you for your interest in contributing to Smart Scribe! This document provides guidelines for contributing to the project.

## Pull Request Process

### Before Creating a PR

1. **Fork the repository** (if you're an external contributor)
2. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

### Making Changes

1. **Write clear, focused commits**
   - Keep commits atomic (one logical change per commit)
   - Write descriptive commit messages
   - Format: `<type>: <description>`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

2. **Follow the code style**
   - Use consistent indentation (2 spaces)
   - Follow JavaScript/Node.js best practices
   - Ensure security best practices for encryption and authentication

3. **Test your changes**
   - Verify all existing functionality still works
   - Test any new features thoroughly
   - Ensure security features work as expected

### Creating a Pull Request

1. **Push your changes** to your fork or branch:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create the PR on GitHub**:
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your feature branch
   - Fill in the PR template with:
     - Clear description of changes
     - Why the changes are needed
     - Any testing performed
     - Screenshots (for UI changes)

3. **PR Title Format**:
   - Use descriptive titles: "Add user authentication feature" not "Update files"
   - Reference issues if applicable: "Fix #123: Resolve database connection issue"

### During Review

1. **Respond to feedback promptly**
2. **Make requested changes** in new commits (don't force-push during review)
3. **Update the PR description** if scope changes
4. **Keep the PR focused** - one feature or fix per PR

### Merging

**Repository maintainers will merge your PR when:**
- All review comments are addressed
- CI checks pass (when available)
- Code meets quality standards
- No merge conflicts exist

**To merge a PR (for maintainers):**

Using GitHub UI:
1. Go to the PR page
2. Click "Merge pull request" button
3. Choose merge method (squash, merge, or rebase)
4. Confirm the merge

Using GitHub CLI:
```bash
gh pr merge <pr-number> --merge    # Regular merge
gh pr merge <pr-number> --squash   # Squash commits
gh pr merge <pr-number> --rebase   # Rebase
```

Using git commands:
```bash
git checkout main
git pull origin main
git merge --no-ff feature/your-feature-name
git push origin main
```

## Code Guidelines

### Security

- **Never commit sensitive data** (API keys, passwords, encryption keys)
- **Always encrypt sensitive data at rest** using AES-256-GCM
- **Use PBKDF2 with at least 100k iterations** for password hashing
- **Validate and sanitize all user inputs**
- **Use parameterized queries** to prevent SQL injection

### JavaScript/Node.js

- Use modern ES6+ syntax
- Use `const` by default, `let` when reassignment is needed
- Prefer async/await over raw promises
- Handle errors appropriately with try-catch
- Add JSDoc comments for public APIs

### File Organization

```
backend/
├── ai/           # AI model and inference logic
├── database/     # Database setup and models
└── security/     # Authentication and encryption
frontend/         # (Future) React UI components
tests/            # (Future) Test files
```

## Development Setup

### Prerequisites

- Node.js 16+ 
- npm or yarn
- SQLite3

### Installation

```bash
# Clone the repository
git clone https://github.com/builderBob79r/smart-scribe.git
cd smart-scribe

# Install dependencies
npm install

# (Future) Run the application
npm start
```

## Questions?

If you have questions about contributing:
- Open an issue with the `question` label
- Check existing issues and PRs for similar discussions
- Review the project README for basic information

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
