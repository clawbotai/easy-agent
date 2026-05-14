import { getSettingsPaths } from "../utils/paths.js";
import { readJsonSettingsFile } from "../utils/settings.js";
import type { AgentRole } from "./types.js";

export interface AgentCommandSettings {
  command: string;
  args: string[];
  timeoutMs: number;
}

export interface CollaborationSettings {
  agents: Record<AgentRole, AgentCommandSettings>;
}

interface RawAgentSettings {
  command?: unknown;
  args?: unknown;
  timeoutMs?: unknown;
}

interface RawCollaborationSettings {
  agents?: {
    claude?: RawAgentSettings;
    codex?: RawAgentSettings;
  };
}

const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;

const DEFAULT_SETTINGS: CollaborationSettings = {
  agents: {
    claude: {
      command: "claude",
      args: ["-p", "--output-format", "text"],
      timeoutMs: DEFAULT_TIMEOUT_MS,
    },
    codex: {
      command: "codex",
      args: ["exec", "--json", "--skip-git-repo-check"],
      timeoutMs: DEFAULT_TIMEOUT_MS,
    },
  },
};

function normalizeAgentSettings(
  base: AgentCommandSettings,
  raw: RawAgentSettings | undefined,
): AgentCommandSettings {
  if (!raw || typeof raw !== "object") return base;
  return {
    command: typeof raw.command === "string" && raw.command.trim() ? raw.command.trim() : base.command,
    args: Array.isArray(raw.args) && raw.args.every((item) => typeof item === "string")
      ? [...raw.args]
      : [...base.args],
    timeoutMs: typeof raw.timeoutMs === "number" && Number.isFinite(raw.timeoutMs) && raw.timeoutMs > 0
      ? raw.timeoutMs
      : base.timeoutMs,
  };
}

function mergeSettings(
  base: CollaborationSettings,
  raw: RawCollaborationSettings | null,
): CollaborationSettings {
  if (!raw?.agents) return base;
  return {
    agents: {
      claude: normalizeAgentSettings(base.agents.claude, raw.agents.claude),
      codex: normalizeAgentSettings(base.agents.codex, raw.agents.codex),
    },
  };
}

export async function loadCollaborationSettings(cwd: string): Promise<CollaborationSettings> {
  const paths = getSettingsPaths(cwd);
  const [userSettings, projectSettings] = await Promise.all([
    readJsonSettingsFile<RawCollaborationSettings>(paths.user),
    readJsonSettingsFile<RawCollaborationSettings>(paths.project),
  ]);

  let settings = DEFAULT_SETTINGS;
  settings = mergeSettings(settings, userSettings.raw);
  settings = mergeSettings(settings, projectSettings.raw);
  return settings;
}
