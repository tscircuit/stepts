#!/usr/bin/env bun
import { execSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { parseRepository } from "../lib"

const KICAD_MODELS_DIR = "kicad-models"
const KICAD_REPO_URL = "https://github.com/KiCad/kicad-packages3D.git"

// ANSI color codes
const GREEN = "\x1b[32m"
const RED = "\x1b[31m"
const RESET = "\x1b[0m"
const BOLD = "\x1b[1m"

function findStepFiles(dir: string): string[] {
  const stepFiles: string[] = []

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir)
    for (const entry of entries) {
      const fullPath = join(currentDir, entry)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        walk(fullPath)
      } else if (
        entry.toLowerCase().endsWith(".step") ||
        entry.toLowerCase().endsWith(".stp")
      ) {
        stepFiles.push(fullPath)
      }
    }
  }

  walk(dir)
  return stepFiles
}

async function main() {
  // Check if kicad-models directory exists
  if (!existsSync(KICAD_MODELS_DIR)) {
    console.log(`Cloning KiCad 3D models repository...`)
    execSync(`git clone --depth 1 ${KICAD_REPO_URL} ${KICAD_MODELS_DIR}`, {
      stdio: "inherit",
    })
    console.log(`Clone complete.\n`)
  } else {
    console.log(`Found existing ${KICAD_MODELS_DIR} directory.\n`)
  }

  // Find all STEP files
  console.log(`Scanning for STEP files...`)
  const stepFiles = findStepFiles(KICAD_MODELS_DIR)
  console.log(`Found ${stepFiles.length} STEP files.\n`)

  let successCount = 0
  let failCount = 0

  for (const filePath of stepFiles) {
    try {
      const content = readFileSync(filePath, "utf-8")
      parseRepository(content)
      console.log(`${GREEN}✓ ${filePath}${RESET}`)
      successCount++
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      console.log(`${RED}✗ ${filePath}${RESET}`)
      console.log(`  ${RED}${errorMessage.split("\n")[0]}${RESET}`)
      failCount++
    }
  }

  const total = successCount + failCount
  const percentage = total > 0 ? ((successCount / total) * 100).toFixed(2) : 0

  console.log(`\n${BOLD}Results:${RESET}`)
  console.log(`${GREEN}Passed: ${successCount}${RESET}`)
  console.log(`${RED}Failed: ${failCount}${RESET}`)
  console.log(`${BOLD}Success rate: ${percentage}%${RESET}`)
}

main()
