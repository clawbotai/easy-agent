import { create } from 'zustand';
import { Agent, Run } from '@/lib/types';

interface AppState {
  currentRun: Run | null;
  runs: Run[];
  workspace: string;
  agents: Agent[];
  query: string;
  setCurrentRun: (run: Run | null) => void;
  setRuns: (runs: Run[]) => void;
  setWorkspace: (workspace: string) => void;
  setAgents: (agents: Agent[]) => void;
  setQuery: (query: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentRun: null,
  runs: [],
  workspace: '',
  agents: [],
  query: '',
  setCurrentRun: (run) => set({ currentRun: run }),
  setRuns: (runs) => set({ runs }),
  setWorkspace: (workspace) => set({ workspace }),
  setAgents: (agents) => set({ agents }),
  setQuery: (query) => set({ query }),
}));
