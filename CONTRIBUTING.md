# Contributing to crx-permission-linter

Thank you for your interest in contributing to crx-permission-linter! This document provides guidelines for contributing to this project.

## How to Fork and Clone

1. **Fork the repository**: Click the "Fork" button on the GitHub page to create your own copy of the repository
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/crx-permission-linter.git
   cd crx-permission-linter
   ```
3. **Add the original repository as upstream**:
   ```bash
   git remote add upstream https://github.com/theluckystrike/crx-permission-linter.git
   ```
4. **Keep your fork in sync**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

## Development Setup

1. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

2. **Run the linter locally**:
   ```bash
   npm run build
   npm start -- /path/to/manifest.json
   ```

3. **Run tests**:
   ```bash
   npm test
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

## Code Style Guidelines

- Use **TypeScript** for all new code
- Follow the existing code style in the repository
- Use 2 spaces for indentation
- Add type annotations for function parameters and return values
- Keep lines under 100 characters when possible
- Write meaningful commit messages

## How to Submit PRs

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit them:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

3. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request**:
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your branch and submit
   - Fill in the PR template with all relevant details

5. **Respond to review feedback** and make changes as needed

## Issue Reporting Guidelines

When reporting bugs or requesting features:

1. **Search existing issues** to avoid duplicates
2. **Use the issue templates** when available
3. **Provide detailed information**:
   - For bugs: Steps to reproduce, expected vs actual behavior, environment details
   - For features: Clear description of the feature and its use case
4. **Include relevant files** such as manifest.json samples when applicable
5. **Tag appropriately** using labels if you have permission

---

Built at [zovo.one](https://zovo.one) by [theluckystrike](https://github.com/theluckystrike)
