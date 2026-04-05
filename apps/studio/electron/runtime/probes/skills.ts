import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { SkillCatalogItem, SkillCatalogSection } from "@openclaw/shared";

type SkillSectionBuilder = () => Promise<SkillCatalogSection | null>;

interface LiveSkillProbe {
  source: "live" | "mock";
  rootsScanned: string[];
  totalSkills: number;
  sections: SkillCatalogSection[];
}

const homeDirectory = os.homedir();
const openclawRoot = path.join(homeDirectory, ".openclaw");
const codexRoot = path.join(homeDirectory, ".codex");

function shortenHomePath(rawPath: string): string {
  return rawPath.startsWith(homeDirectory) ? rawPath.replace(homeDirectory, "~") : rawPath;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listDirectSkillItems(
  rootDirectory: string,
  options: {
    id: string;
    label: string;
    description: string;
    origin: string;
    status: "Indexed" | "Installed" | "System";
    detail: string;
    tone: SkillCatalogItem["tone"];
  }
): Promise<SkillCatalogSection | null> {
  if (!(await pathExists(rootDirectory))) {
    return null;
  }

  const entries = await fs.readdir(rootDirectory, { withFileTypes: true });
  const items = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const skillDirectory = path.join(rootDirectory, entry.name);
        const skillFilePath = path.join(skillDirectory, "SKILL.md");

        if (!(await pathExists(skillFilePath))) {
          return null;
        }

        const hasMetadata = await Promise.all([
          pathExists(path.join(skillDirectory, "_meta.json")),
          pathExists(path.join(skillDirectory, "metadata.json")),
          pathExists(path.join(skillDirectory, "config.json")),
          pathExists(path.join(skillDirectory, ".clawhub", "origin.json"))
        ]).then((results) => results.some(Boolean));

        return {
          id: `${options.id}-${entry.name}`,
          name: entry.name,
          surface: "Skill",
          status: options.status === "System" ? "System" : hasMetadata ? "Indexed" : options.status,
          source: "runtime",
          detail: hasMetadata ? `${options.detail} Metadata or config files were also detected.` : options.detail,
          origin: options.origin,
          path: shortenHomePath(skillDirectory),
          tone: options.tone
        } satisfies SkillCatalogItem;
      })
  );

  const resolvedItems = items
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));

  if (resolvedItems.length === 0) {
    return null;
  }

  return {
    id: options.id,
    label: options.label,
    description: options.description,
    items: resolvedItems
  };
}

async function listExtensionSkillItems(): Promise<SkillCatalogSection | null> {
  const extensionsDirectory = path.join(openclawRoot, "extensions");

  if (!(await pathExists(extensionsDirectory))) {
    return null;
  }

  const extensionEntries = await fs.readdir(extensionsDirectory, { withFileTypes: true });
  const items: SkillCatalogItem[] = [];

  for (const extensionEntry of extensionEntries) {
    if (!extensionEntry.isDirectory()) {
      continue;
    }

    const skillRoot = path.join(extensionsDirectory, extensionEntry.name, "skills");

    if (!(await pathExists(skillRoot))) {
      continue;
    }

    const skillEntries = await fs.readdir(skillRoot, { withFileTypes: true });

    for (const skillEntry of skillEntries) {
      if (!skillEntry.isDirectory()) {
        continue;
      }

      const skillDirectory = path.join(skillRoot, skillEntry.name);
      const skillFilePath = path.join(skillDirectory, "SKILL.md");

      if (!(await pathExists(skillFilePath))) {
        continue;
      }

      items.push({
        id: `skill-extension-${extensionEntry.name}-${skillEntry.name}`,
        name: skillEntry.name,
        surface: "Skill",
        status: "Extension",
        source: "runtime",
        detail: "Local extension bundle exposes this skill directory.",
        origin: `Extension: ${extensionEntry.name}`,
        path: shortenHomePath(skillDirectory),
        tone: "neutral"
      });
    }
  }

  if (items.length === 0) {
    return null;
  }

  return {
    id: "skills-extensions",
    label: "Extension Skills",
    description: "Skills discovered from local OpenClaw extension directories.",
    items: items.sort((left, right) => left.name.localeCompare(right.name))
  };
}

export async function probeLiveSkills(): Promise<LiveSkillProbe> {
  const sectionBuilders: Array<{ root: string; build: SkillSectionBuilder }> = [
    {
      root: path.join(openclawRoot, "skills"),
      build: () =>
        listDirectSkillItems(path.join(openclawRoot, "skills"), {
          id: "skills-openclaw-home",
          label: "OpenClaw Skills",
          description: "Skills installed directly under the local OpenClaw home.",
          origin: "OpenClaw Home",
          status: "Installed",
          detail: "SKILL.md was found in a local OpenClaw skill directory.",
          tone: "positive"
        })
    },
    {
      root: path.join(openclawRoot, "workspace", "skills"),
      build: () =>
        listDirectSkillItems(path.join(openclawRoot, "workspace", "skills"), {
          id: "skills-workspace",
          label: "Workspace Skills",
          description: "Workspace-managed skill directories discovered from the local OpenClaw workspace.",
          origin: "Workspace",
          status: "Installed",
          detail: "Workspace skill directory was found locally.",
          tone: "positive"
        })
    },
    {
      root: path.join(openclawRoot, "extensions"),
      build: () => listExtensionSkillItems()
    },
    {
      root: path.join(codexRoot, "skills", ".system"),
      build: () =>
        listDirectSkillItems(path.join(codexRoot, "skills", ".system"), {
          id: "skills-codex-system",
          label: "Codex System Skills",
          description: "Bundled system skills discovered from the local Codex install.",
          origin: "Codex System",
          status: "System",
          detail: "Bundled system skill directory was found locally.",
          tone: "neutral"
        })
    }
  ];

  const sections = (
    await Promise.all(
      sectionBuilders.map(async (builder) => {
        const section = await builder.build();
        return section ? { root: builder.root, section } : null;
      })
    )
  ).filter((entry): entry is { root: string; section: SkillCatalogSection } => entry !== null);

  return {
    source: sections.length > 0 ? "live" : "mock",
    rootsScanned: sectionBuilders.map((builder) => builder.root),
    totalSkills: sections.reduce((total, section) => total + section.section.items.length, 0),
    sections: sections.map((section) => section.section)
  };
}
