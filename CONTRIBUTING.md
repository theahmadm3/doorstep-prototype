# Contributing to Doorstep Prototype

Thank you for your interest in contributing to Doorstep Prototype! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and professional in all interactions
- Follow the project's coding standards and conventions
- Write clear, maintainable code with proper documentation
- Test your changes thoroughly before submitting

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/doorstep-prototype.git
   cd doorstep-prototype
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/theahmadm3/doorstep-prototype.git
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Set up your environment variables (copy `.env.example` to `.env.local`)

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Use descriptive branch names:
- `feature/add-payment-integration`
- `fix/order-status-update`
- `docs/update-api-documentation`
- `refactor/improve-cart-logic`

### 2. Make Your Changes

- Write clean, readable code
- Follow TypeScript best practices
- Add proper type definitions
- Keep components small and focused
- Use meaningful variable and function names

### 3. Code Quality Checks

Before committing, ensure your code passes all checks:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build test
npm run build
```

### 4. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "Add feature: brief description of changes"
```

Good commit message examples:
- `Fix: Resolve order status update bug`
- `Feature: Add restaurant search functionality`
- `Refactor: Improve cart state management`
- `Docs: Update API documentation`

### 5. Keep Your Branch Updated

Regularly sync with the upstream repository:

```bash
git fetch upstream
git rebase upstream/main
```

### 6. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request

1. Go to the repository on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template with:
   - Description of changes
   - Related issue numbers
   - Screenshots (if UI changes)
   - Testing steps

## Coding Standards

### TypeScript

- Use strict TypeScript (no `any` types unless absolutely necessary)
- Define interfaces for all component props
- Export types from `src/lib/types/index.ts`
- Use type inference where appropriate

Example:
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button = ({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) => {
  // Component implementation
};
```

### React Components

- Use functional components with hooks
- Keep components under 200 lines when possible
- Extract reusable logic into custom hooks
- Use proper prop destructuring
- Add JSDoc comments for complex components

Example:
```typescript
/**
 * Displays a product card with image, name, price, and add to cart button
 */
export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  // Component implementation
};
```

### Styling

- Use Tailwind CSS utility classes
- Follow the existing design system
- Ensure responsive design (mobile-first approach)
- Use semantic HTML elements
- Keep styles consistent across the application

### File Organization

```
src/
├── app/              # Pages and routes
├── components/       # Reusable components
│   ├── ui/           # Base UI components
│   └── [feature]/    # Feature-specific components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and helpers
│   ├── types/        # TypeScript types
│   ├── api.ts        # API functions
│   └── utils.ts      # Utility functions
└── stores/           # State management
```

## Testing

While we don't currently have a comprehensive test suite, please manually test your changes:

1. Test all affected user flows
2. Test on different screen sizes (mobile, tablet, desktop)
3. Test edge cases and error scenarios
4. Verify TypeScript compilation succeeds
5. Check for console errors

## Pull Request Guidelines

### PR Title Format

Use conventional commit format:
- `feat: Add restaurant filtering`
- `fix: Resolve cart update issue`
- `docs: Update README`
- `refactor: Improve order processing`
- `style: Update button colors`
- `test: Add cart tests`

### PR Description Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Closes #123

## Changes Made
- List the main changes
- Be specific and clear

## Testing
Describe how to test the changes

## Screenshots
(If applicable)

## Checklist
- [ ] Code follows the style guidelines
- [ ] TypeScript compilation succeeds
- [ ] Linting passes
- [ ] Changes have been tested
- [ ] Documentation updated (if needed)
```

## Reporting Bugs

When reporting bugs, please include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Environment**: Browser, OS, screen size
7. **Additional Context**: Any other relevant information

## Suggesting Features

When suggesting features, please include:

1. **Problem Statement**: What problem does this solve?
2. **Proposed Solution**: How should it work?
3. **Alternatives Considered**: Other approaches you've thought about
4. **Additional Context**: Mockups, examples, etc.

## Questions?

If you have questions:
- Open an issue on GitHub
- Check existing issues and discussions
- Review the documentation

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing to Doorstep Prototype! 🎉
