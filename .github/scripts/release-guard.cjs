const fs = require("node:fs")

function releaseMode(eventName, ref, event) {
  if (ref !== "refs/heads/main") return "skip"
  if (eventName === "workflow_dispatch") {
    const { operation, confirmation } = event.inputs || {}
    if (
      operation === "recover-0.0.5" &&
      confirmation === "publish stepts@0.0.5"
    )
      return "recovery"
    if (operation === "release" && confirmation === "release next version") {
      return "release"
    }
    return "skip"
  }
  if (eventName !== "push" || event.deleted || !event.head_commit) return "skip"
  // Covers squash titles and the PR title in a merge commit's body.
  if (
    /^(?:v\d+\.\d+\.\d+\b|chore: bump version to\b)/m.test(
      event.head_commit.message || "",
    )
  ) {
    return "skip"
  }
  return "release"
}

module.exports = { releaseMode }
if (require.main === module) {
  const mode = releaseMode(
    process.env.GITHUB_EVENT_NAME,
    process.env.GITHUB_REF,
    JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")),
  )
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `mode=${mode}\n`)
  console.log(`Release mode: ${mode}`)
}
