# Feltable fork workflow

This repository is Feltable's maintained Fyendal fork. The public Fyendal
repository remains the upstream source; Feltable's fork owns product changes,
release history, and CI results.

## Remotes and branches

- `upstream`: `https://github.com/Fyendal/fyendal.net.git`
- `origin`: the Feltable-owned GitHub fork
- `main`: protected, reviewed, and releasable Feltable history
- `feature/*` and `fix/*`: short-lived product branches
- `upstream-sync/*`: temporary branches used to review upstream updates

The initial `feltable-integration` branch is a migration boundary while the
existing local commits are reviewed and pushed. Once accepted, merge it into
the fork's protected `main`; do not retain it as a permanent parallel trunk.

## Upstream update procedure

1. Ensure the worktree is clean and fetch `upstream`.
2. Create `upstream-sync/YYYY-MM-DD` from the fork's `main`.
3. Review `main..upstream/main` before merging.
4. Merge `upstream/main` into the sync branch. Do not force-push rewritten
   upstream history into the product branch.
5. Resolve only real overlaps, preserving engine invariants and Feltable tests.
6. Run affected package tests and typechecks. Run `pnpm release:check` for a
   significant engine or server update.
7. Open a pull request into the fork's `main`; merge only after CI and review.
8. Update the Feltable product's pinned Fyendal revision after integration
   checks pass.

## Repository boundary

Commit reusable product behavior, engine/card fixes, bot policies, migrations,
and minimized regression fixtures to the fork. Do not commit raw player replay
exports, generated Learn Next reports, credentials, or local databases.

Replay-derived experiments remain local until their required state is reduced
to a small non-identifying scenario fixture. The minimized scenario and its
expected outcome may then become a normal regression test.

## Contributing upstream

When a fix benefits Fyendal independently of Feltable, create a focused branch
from `upstream/main`, cherry-pick or reproduce only that fix, run upstream's
required checks, and open a pull request to `Fyendal/fyendal.net`. Do not send
Feltable-specific product behavior or replay evidence in that pull request.
