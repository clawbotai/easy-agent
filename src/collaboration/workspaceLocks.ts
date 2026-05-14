import * as path from "node:path";

const activeWorkspaceRuns = new Map<string, string>();

export function acquireWorkspaceLock(workspace: string, runId: string): () => void {
  const key = path.resolve(workspace);
  const owner = activeWorkspaceRuns.get(key);
  if (owner && owner !== runId) {
    throw new Error(`Workspace is already locked by run ${owner}`);
  }

  activeWorkspaceRuns.set(key, runId);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (activeWorkspaceRuns.get(key) === runId) {
      activeWorkspaceRuns.delete(key);
    }
  };
}

export function getWorkspaceLockOwner(workspace: string): string | null {
  return activeWorkspaceRuns.get(path.resolve(workspace)) ?? null;
}
