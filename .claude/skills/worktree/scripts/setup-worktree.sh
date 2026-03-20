#!/usr/bin/env bash
set -uo pipefail

WORKTREE_NAME="${1:?Usage: setup-worktree.sh <worktree-name>}"
PROJECT_ROOT="$(pwd)"
WORKTREE_DIR="$PROJECT_ROOT/.claude/worktrees/$WORKTREE_NAME"
CLAUDE_BIN="/Users/kevinpruett/.local/bin/claude"
TMUX_SESSION="${2:-meal-prep}"

# --- Preflight checks ---
if ! tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
    echo "ERROR: tmux session '$TMUX_SESSION' not found"
    exit 1
fi

if [ -d "$WORKTREE_DIR" ]; then
    echo "ERROR: Worktree '$WORKTREE_NAME' already exists at $WORKTREE_DIR"
    exit 1
fi

# --- Find next available port (3001+) ---
find_next_port() {
    local port=3001
    while true; do
        local claimed=false
        for pkg in "$PROJECT_ROOT"/.claude/worktrees/*/package.json; do
            [ -f "$pkg" ] || continue
            if grep -q -- "--port $port" "$pkg" 2>/dev/null; then
                claimed=true
                break
            fi
        done

        if [ "$claimed" = false ] && ! lsof -iTCP:"$port" -sTCP:LISTEN &>/dev/null 2>&1; then
            echo "$port"
            return
        fi
        ((port++))
    done
}

PORT=$(find_next_port)
echo "PORT=$PORT"

# --- Create tmux window with claude worktree session ---
# Use shell -ic to get a login shell with proper TTY allocation
tmux new-window -t "$TMUX_SESSION" -n "$WORKTREE_NAME" \
    "zsh -ic '$CLAUDE_BIN -w $WORKTREE_NAME'"
echo "Created tmux window: $WORKTREE_NAME"

# --- Wait for worktree to be created ---
echo "Waiting for worktree..."
for i in $(seq 1 30); do
    [ -f "$WORKTREE_DIR/package.json" ] && break
    sleep 1
done

if [ ! -f "$WORKTREE_DIR/package.json" ]; then
    echo "ERROR: Worktree not created after 30s"
    echo "Check tmux window '$WORKTREE_NAME' for errors"
    exit 1
fi
echo "Worktree created"

# --- Copy .env.local ---
cp "$PROJECT_ROOT/.env.local" "$WORKTREE_DIR/.env.local"
echo "Copied .env.local"

# --- Update port in package.json ---
sed -i '' "s/--port 3000/--port $PORT/" "$WORKTREE_DIR/package.json"
echo "Updated dev port to $PORT"

# --- Install dependencies ---
echo "Installing dependencies..."
(cd "$WORKTREE_DIR" && bun install --frozen-lockfile 2>/dev/null || bun install)

# --- Update Convex TRUSTED_ORIGINS ---
NEW_ORIGIN="http://localhost:$PORT"
CURRENT=$(cd "$WORKTREE_DIR" && bunx convex env get TRUSTED_ORIGINS 2>/dev/null || echo "")
if [ -n "$CURRENT" ]; then
    if ! echo "$CURRENT" | grep -q "$NEW_ORIGIN"; then
        (cd "$WORKTREE_DIR" && bunx convex env set TRUSTED_ORIGINS "$CURRENT,$NEW_ORIGIN")
        echo "Appended $NEW_ORIGIN to TRUSTED_ORIGINS"
    else
        echo "TRUSTED_ORIGINS already includes $NEW_ORIGIN"
    fi
else
    (cd "$WORKTREE_DIR" && bunx convex env set TRUSTED_ORIGINS "http://localhost:3000,$NEW_ORIGIN")
    echo "Set TRUSTED_ORIGINS to http://localhost:3000,$NEW_ORIGIN"
fi

# --- Split pane for vite dev server ---
tmux split-window -t "$TMUX_SESSION:$WORKTREE_NAME" -v -l 12 -c "$WORKTREE_DIR" \
    "bun run dev"

# Focus back on claude pane (top)
tmux select-pane -t "$TMUX_SESSION:$WORKTREE_NAME" -t 0 2>/dev/null \
    || tmux select-pane -t "$TMUX_SESSION:$WORKTREE_NAME" -U 2>/dev/null

echo "Worktree '$WORKTREE_NAME' ready at http://localhost:$PORT"
