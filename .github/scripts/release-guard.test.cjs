const assert = require("node:assert/strict")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const { spawnSync } = require("node:child_process")
const { test } = require("node:test")
const { releaseMode } = require("./release-guard.cjs")

const main = "refs/heads/main"
for (const [name, eventName, ref, event, expected] of [
  [
    "ordinary push",
    "push",
    main,
    { head_commit: { message: "fix: parser" } },
    "release",
  ],
  [
    "legacy version commit",
    "push",
    main,
    { head_commit: { message: "v0.0.5" } },
    "skip",
  ],
  [
    "bump squash",
    "push",
    main,
    { head_commit: { message: "chore: bump version to 0.0.5 (#23)" } },
    "skip",
  ],
  [
    "bump merge",
    "push",
    main,
    {
      head_commit: {
        message:
          "Merge pull request #23 from tscircuit/bump-version-6\n\nchore: bump version to 0.0.5",
      },
    },
    "skip",
  ],
  [
    "legacy version merge",
    "push",
    main,
    { head_commit: { message: "Merge pull request #23\n\nv0.0.5" } },
    "skip",
  ],
  ["deleted ref", "push", main, { deleted: true }, "skip"],
  ["missing head", "push", main, {}, "skip"],
  [
    "other branch",
    "push",
    "refs/heads/other",
    { head_commit: { message: "fix: parser" } },
    "skip",
  ],
  ["PR", "pull_request", main, {}, "skip"],
  ["default dispatch", "workflow_dispatch", main, {}, "skip"],
  [
    "none dispatch",
    "workflow_dispatch",
    main,
    { inputs: { operation: "none" } },
    "skip",
  ],
  [
    "routine confirmed",
    "workflow_dispatch",
    main,
    { inputs: { operation: "release", confirmation: "release next version" } },
    "release",
  ],
  [
    "routine unconfirmed",
    "workflow_dispatch",
    main,
    { inputs: { operation: "release" } },
    "skip",
  ],
  [
    "recovery confirmed",
    "workflow_dispatch",
    main,
    {
      inputs: {
        operation: "recover-0.0.5",
        confirmation: "publish stepts@0.0.5",
      },
    },
    "recovery",
  ],
  [
    "recovery unconfirmed",
    "workflow_dispatch",
    main,
    { inputs: { operation: "recover-0.0.5" } },
    "skip",
  ],
  [
    "wrong confirmation",
    "workflow_dispatch",
    main,
    {
      inputs: {
        operation: "recover-0.0.5",
        confirmation: "release next version",
      },
    },
    "skip",
  ],
  [
    "recovery wrong branch",
    "workflow_dispatch",
    "refs/heads/other",
    {
      inputs: {
        operation: "recover-0.0.5",
        confirmation: "publish stepts@0.0.5",
      },
    },
    "skip",
  ],
  [
    "unknown operation",
    "workflow_dispatch",
    main,
    { inputs: { operation: "unknown", confirmation: "publish stepts@0.0.5" } },
    "skip",
  ],
]) {
  test(name, () => assert.equal(releaseMode(eventName, ref, event), expected))
}

// Execute only the registry validation heredoc, never the publish command.
const workflow = fs.readFileSync(
  path.join(__dirname, "../workflows/bun-pver-release.yml"),
  "utf8",
)
const registryCheck = workflow
  .match(/<<'NODE'\n([\s\S]*?)\n          NODE/)[1]
  .replace(/^          /gm, "")
const valid = {
  name: "stepts",
  versions: { "0.0.4": {} },
  "dist-tags": { latest: "0.0.4" },
}
for (const [name, data, success] of [
  ["absent version", JSON.stringify(valid), true],
  [
    "already published",
    JSON.stringify({ ...valid, versions: { "0.0.4": {}, "0.0.5": {} } }),
    false,
  ],
  [
    "latest changed",
    JSON.stringify({ ...valid, "dist-tags": { latest: "0.0.6" } }),
    false,
  ],
  ["wrong package", JSON.stringify({ ...valid, name: "other" }), false],
  [
    "missing versions",
    JSON.stringify({ ...valid, versions: undefined }),
    false,
  ],
  [
    "missing dist tags",
    JSON.stringify({ ...valid, "dist-tags": undefined }),
    false,
  ],
  ["invalid JSON", "not JSON", false],
]) {
  test(`registry: ${name}`, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stepts-registry-"))
    try {
      const file = path.join(dir, "registry.json")
      fs.writeFileSync(file, data)
      const result = spawnSync(process.execPath, ["-", file], {
        input: registryCheck,
        encoding: "utf8",
      })
      assert.equal(result.status === 0, success, result.stderr)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
}
