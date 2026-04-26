const { spawnSync } = require("node:child_process");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

const steps = [
  {
    label: "Doctor",
    command: "npm",
    args: ["run", "doctor"]
  },
  {
    label: "Production audit",
    command: "npm",
    args: ["audit", "--omit=dev", "--registry=https://registry.npmjs.org/"]
  },
  {
    label: "Full audit",
    command: "npm",
    args: ["audit", "--registry=https://registry.npmjs.org/"]
  },
  {
    label: "Typecheck",
    command: "npm",
    args: ["run", "typecheck"]
  },
  {
    label: "Unit tests",
    command: "npm",
    args: ["run", "test", "--workspace", "@openclaw/studio", "--", "--run"]
  },
  {
    label: "Build",
    command: "npm",
    args: ["run", "build"]
  },
  {
    label: "Static smoke",
    command: "npm",
    args: ["run", "smoke"]
  },
  {
    label: "Electron start smoke",
    command: "npm",
    args: ["run", "start:smoke"]
  },
  {
    label: "Alpha package",
    command: "npm",
    args: ["run", "package:alpha"]
  },
  {
    label: "Packaged app smoke",
    command: "npm",
    args: ["run", "package:smoke"]
  },
  {
    label: "Release plan",
    command: "npm",
    args: ["run", "release:plan"]
  }
];

function runStep(step, index) {
  const prefix = `[${index + 1}/${steps.length}] ${step.label}`;
  console.log(`\n${prefix}`);
  console.log(`> ${step.command} ${step.args.join(" ")}`);

  const result = spawnSync(step.command, step.args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      npm_config_audit_level: process.env.npm_config_audit_level ?? "moderate"
    }
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(`${step.label} failed with exit code ${result.status ?? 1}.`);
  }
}

for (const [index, step] of steps.entries()) {
  runStep(step, index);
}

console.log("\nOpenClaw Studio product verification passed.");
