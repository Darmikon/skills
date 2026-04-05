# Conventional Commit Examples

Real-world examples following Angular conventional commit format for this project.

## Web3 Features

### Adding New Components

```
feat(web3): add Address component with ENS support

Implement Address component that displays Ethereum addresses
with optional ENS name resolution. Includes blockie avatar
generation and copy-to-clipboard functionality.

Closes #23
```

### Smart Contract Integration

```
feat(contracts): integrate YourCollectible NFT contract

Add contract hooks, ABI types, and deployment configuration
for YourCollectible.sol. Includes auto-generated TypeScript
types and deployed addresses for all supported networks.
```

### Network Configuration

```
feat(networks): add Optimism network support

Configure Optimism mainnet and testnet with RPC endpoints,
block explorers, and native currency metadata. Updates
target networks in scaffold.config.ts
```

## Bug Fixes

### Component Fixes

```
fix(balance): prevent flickering on wallet disconnect

Balance component was briefly showing stale data when
disconnecting wallet. Now immediately clears displayed
balance on disconnect event.

Fixes #78
```

### Hook Fixes

```
fix(hooks): correct useScaffoldReadContract type inference

Generic type parameters were not properly narrowed, causing
TypeScript errors when accessing contract read results.
Updates type constraints to properly infer return types.
```

### State Management

```
fix(store): resolve hydration mismatch in demo store

Zustand store was causing hydration errors due to server/
client mismatch. Implements proper hydration check using
useZustandHydration hook.

Fixes #91
```

## Refactoring

### Code Organization

```
refactor(ui): reorganize components by atomic design

Restructure packages/ui into atoms/, molecules/, and
organisms/ folders following atomic design principles.
Updates all import paths and barrel exports.
```

### Utilities

```
refactor(web3): extract common contract interaction logic

Create useTransactor hook to handle common transaction
patterns (error handling, notifications, gas estimation).
Reduces duplication across contract write hooks.
```

### Type Improvements

```
refactor(types): consolidate chain type definitions

Merge scattered chain-related types into single
networks/types.ts module. Improves type safety and
reduces circular dependencies.
```

## Performance

### Optimization

```
perf(blockexplorer): implement virtual scrolling for transactions

Replace full list rendering with react-window virtualization.
Reduces initial render time for pages with 1000+ transactions
from 3s to <100ms.
```

### Caching

```
perf(api): add React Query caching for price fetches

Implement 30s stale-while-revalidate caching for Uniswap
price API. Reduces redundant API calls by ~80% in typical
usage.
```

## Testing

### Unit Tests

```
test(hooks): add tests for useDisplayUsdMode hook

Implement comprehensive test suite covering toggle behavior,
localStorage persistence, and SSR compatibility.
Uses vitest and @testing-library/react-hooks.
```

### Contract Tests

```
test(contracts): add YourCollectible deployment tests

Verify contract deploys correctly, initial state is set,
and ownership is transferred to deployer. Uses hardhat-deploy
fixtures for deterministic testing.
```

## Documentation

### README Updates

```
docs(readme): add installation and quickstart guide

Document pnpm workspace setup, required environment
variables, and basic development workflow. Includes
troubleshooting section for common issues.
```

### Code Documentation

```
docs(hooks): add JSDoc comments to scaffold hooks

Document parameters, return values, and usage examples
for useScaffoldReadContract, useScaffoldWriteContract,
and useScaffoldEventHistory.
```

## Build & Dependencies

### Dependency Updates

```
build(deps): upgrade wagmi to 2.5.7

Update wagmi and viem to latest versions for improved
type safety and bug fixes. Includes migration of
deprecated useConnect hooks.

BREAKING CHANGE: useConnect now returns array instead
of object. Update all usages to destructure array.
```

### Build Configuration

```
build(nextjs): optimize bundle with SWC minification

Enable SWC minification in next.config.ts for 20%
smaller production bundles. Configure source maps
for better debugging in production.
```

### Monorepo Configuration

```
build(monorepo): configure pnpm workspace dependencies

Set up proper workspace protocol for internal packages.
Ensures consistent versioning and hot-reloading during
development.
```

## CI/CD

### GitHub Actions

```
ci(github): add automated testing workflow

Implement CI pipeline that runs unit tests, lints code,
and type-checks on every PR. Uses pnpm cache for faster
builds.
```

### Deployment

```
ci(vercel): configure deployment with environment secrets

Set up Vercel deployment with proper environment variable
configuration for Alchemy API keys and WalletConnect IDs.
Adds preview deployments for PRs.
```

## Chores & Maintenance

### Cleanup

```
chore(cleanup): remove unused IPFS utilities

Delete deprecated IPFS upload/download functions that
were replaced by nft-storage integration. Removes
associated dependencies and test files.
```

### Configuration

```
chore(config): update biome linting rules

Add rules for import ordering, unused variables, and
consistent naming. Configure auto-fix on save for
better DX.
```

## Multiple Related Changes (Single Commit)

When changes are closely related and form a cohesive unit:

```
feat(ui): add Button component with shadcn integration

Install shadcn Button component, adapt to project design
tokens (success, warning, destructive colors), create
Storybook story, and export from ui package barrel file.

Component supports all variants (default, destructive,
outline, secondary, ghost, link) and sizes (default,
sm, lg, icon).
```

## Multiple Unrelated Changes (Separate Commits)

When changes are unrelated, create separate commits:

**Scenario**: You fixed a bug AND added a new feature

```bash
# First commit - the bug fix
git add src/components/balance.tsx
git commit -m "fix(balance): prevent flickering on disconnect"

# Second commit - the new feature
git add src/components/price-display.tsx
git commit -m "feat(ui): add PriceDisplay component"
```

## Breaking Changes

### API Changes

```
feat(config): restructure scaffold configuration

Move scaffold.config.ts from root to apps/nextjs/src/web3/.
Rename getTargetNetworks to getTargetNetworks() function.
Add runtime validation for configuration values.

BREAKING CHANGE: Import path changed from
'@/scaffold.config' to '@/web3/scaffold.config'.
getTargetNetworks is now a function, call as
getTargetNetworks() instead of getTargetNetworks.

Migration guide:
1. Update imports: @/scaffold.config → @/web3/scaffold.config
2. Update usage: getTargetNetworks → getTargetNetworks()
```

### Dependency Changes

```
build(deps): upgrade to Next.js 15

Update Next.js from 14.x to 15.x. Includes migration to
new App Router patterns and updated middleware API.

BREAKING CHANGE: Middleware API changed. Update
middleware.ts to use new config export pattern.
See migration guide: https://nextjs.org/docs/upgrade
```

## Reverts

### Reverting a Commit

```
revert: feat(web3): add Optimism network support

This reverts commit abc123. Optimism RPC endpoint
is experiencing instability, reverting until a
reliable provider is configured.
```

## Scopes Reference for This Project

**Common scopes used in scaffold-eth-from-scratch**:

- `web3` - Web3 hooks, providers, utilities
- `contracts` - Smart contract related code
- `ui` - UI package components
- `hooks` - Shared React hooks
- `store` - Zustand state management
- `networks` - Network configuration
- `hardhat` - Hardhat configuration/scripts
- `deploy` - Contract deployment
- `config` - Configuration files
- `deps` - Dependencies
- `monorepo` - Workspace configuration
- `blockexplorer` - Block explorer pages
- `debug` - Contract debugging UI
- `ipfs` - IPFS integration
- `nfts` - NFT functionality
- `api` - API routes
- `docs` - Documentation
- `ci` - CI/CD workflows
- `test` - Testing infrastructure
