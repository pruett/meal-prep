# Agents

## Merge Rules

- **Never merge `package.json` changes from worktree branches.** When merging a worktree branch into main, exclude `package.json` from the merge. Worktree branches may modify `package.json` for local dev purposes (e.g. port overrides), and these changes should not propagate to main. If a branch legitimately needs dependency changes, apply them manually to main's `package.json` after the merge.
