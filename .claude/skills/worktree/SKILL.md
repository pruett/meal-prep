---
name: worktree
description: Spin up an isolated development worktree with its own port, dev servers, and Claude Code session in a dedicated tmux window. Use when asked to "create a worktree", "spin up a worktree", "new worktree", or "/worktree <name>".
---

# Worktree

Create isolated development environments with unique ports, their own dev servers, and a Claude Code session — all in a dedicated tmux window.

## Usage

Run the setup script from the project root (requires sandbox disabled for tmux/lsof/bun):

```bash
bash .claude/skills/worktree/scripts/setup-worktree.sh <worktree-name> [tmux-session]
```

- `<worktree-name>` — name for the worktree and tmux window (e.g. `onboarding`)
- `[tmux-session]` — optional, defaults to `meal-prep`

The script will:
1. Find the next available port starting at 3001
2. Create a tmux window running `claude -w <name>` (creates the git worktree)
3. Copy `.env.local` to the worktree
4. Update `package.json` dev script with the assigned port
5. Run `bun install`
6. Append the new origin to the Convex `TRUSTED_ORIGINS` env var
7. Split the tmux window with `bun run dev` in a bottom pane
8. Focus the Claude session pane (top)

Note: `convex dev` is NOT started per worktree. One instance running in the main project (or any single worktree) is sufficient — all worktrees share the same Convex cloud deployment.

Report the assigned port and window name to the user when done.

## Prerequisites

`convex/auth.ts` must read a `TRUSTED_ORIGINS` env var for multi-port auth support. If it only uses `[siteUrl]` for `trustedOrigins`, the one-time fix is:

```ts
const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(',')
  : [siteUrl]
```

Then use `trustedOrigins` (the variable) in the `betterAuth()` config instead of `[siteUrl]`.

## Caveats

- **Shared Convex deployment** — All worktrees connect to the same Convex dev deployment. `SITE_URL` (Better Auth `baseURL`) stays as `http://localhost:3000`, so OAuth callbacks always redirect to port 3000. `TRUSTED_ORIGINS` allows API requests from worktree ports.
- **Convex function conflicts** — If multiple worktrees run `convex dev` and modify Convex functions, they overwrite each other. Only one worktree should actively develop Convex functions at a time.
- **Port 3000** — Reserved for the main project. Worktree ports start at 3001.
