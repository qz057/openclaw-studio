"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.probeLiveSkills = probeLiveSkills;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const homeDirectory = node_os_1.default.homedir();
const openclawRoot = node_path_1.default.join(homeDirectory, ".openclaw");
const codexRoot = node_path_1.default.join(homeDirectory, ".codex");
function shortenHomePath(rawPath) {
    return rawPath.startsWith(homeDirectory) ? rawPath.replace(homeDirectory, "~") : rawPath;
}
async function pathExists(targetPath) {
    try {
        await promises_1.default.access(targetPath);
        return true;
    }
    catch {
        return false;
    }
}
async function listDirectSkillItems(rootDirectory, options) {
    if (!(await pathExists(rootDirectory))) {
        return null;
    }
    const entries = await promises_1.default.readdir(rootDirectory, { withFileTypes: true });
    const items = await Promise.all(entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
        const skillDirectory = node_path_1.default.join(rootDirectory, entry.name);
        const skillFilePath = node_path_1.default.join(skillDirectory, "SKILL.md");
        if (!(await pathExists(skillFilePath))) {
            return null;
        }
        const hasMetadata = await Promise.all([
            pathExists(node_path_1.default.join(skillDirectory, "_meta.json")),
            pathExists(node_path_1.default.join(skillDirectory, "metadata.json")),
            pathExists(node_path_1.default.join(skillDirectory, "config.json")),
            pathExists(node_path_1.default.join(skillDirectory, ".clawhub", "origin.json"))
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
        };
    }));
    const resolvedItems = items
        .filter((item) => item !== null)
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
async function listExtensionSkillItems() {
    const extensionsDirectory = node_path_1.default.join(openclawRoot, "extensions");
    if (!(await pathExists(extensionsDirectory))) {
        return null;
    }
    const extensionEntries = await promises_1.default.readdir(extensionsDirectory, { withFileTypes: true });
    const items = [];
    for (const extensionEntry of extensionEntries) {
        if (!extensionEntry.isDirectory()) {
            continue;
        }
        const skillRoot = node_path_1.default.join(extensionsDirectory, extensionEntry.name, "skills");
        if (!(await pathExists(skillRoot))) {
            continue;
        }
        const skillEntries = await promises_1.default.readdir(skillRoot, { withFileTypes: true });
        for (const skillEntry of skillEntries) {
            if (!skillEntry.isDirectory()) {
                continue;
            }
            const skillDirectory = node_path_1.default.join(skillRoot, skillEntry.name);
            const skillFilePath = node_path_1.default.join(skillDirectory, "SKILL.md");
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
async function probeLiveSkills() {
    const sectionBuilders = [
        {
            root: node_path_1.default.join(openclawRoot, "skills"),
            build: () => listDirectSkillItems(node_path_1.default.join(openclawRoot, "skills"), {
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
            root: node_path_1.default.join(openclawRoot, "workspace", "skills"),
            build: () => listDirectSkillItems(node_path_1.default.join(openclawRoot, "workspace", "skills"), {
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
            root: node_path_1.default.join(openclawRoot, "extensions"),
            build: () => listExtensionSkillItems()
        },
        {
            root: node_path_1.default.join(codexRoot, "skills", ".system"),
            build: () => listDirectSkillItems(node_path_1.default.join(codexRoot, "skills", ".system"), {
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
    const sections = (await Promise.all(sectionBuilders.map(async (builder) => {
        const section = await builder.build();
        return section ? { root: builder.root, section } : null;
    }))).filter((entry) => entry !== null);
    return {
        source: sections.length > 0 ? "live" : "mock",
        rootsScanned: sectionBuilders.map((builder) => builder.root),
        totalSkills: sections.reduce((total, section) => total + section.section.items.length, 0),
        sections: sections.map((section) => section.section)
    };
}
