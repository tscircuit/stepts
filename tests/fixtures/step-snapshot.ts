import { expect, type MatcherResult } from "bun:test"
import { convertStepToGlb, type StepToGlbOptions } from "./step-to-glb"
import { renderGlbToPng, type GlbToPngOptions } from "./glb-to-png"

export type StepSnapshotOptions = StepToGlbOptions & GlbToPngOptions

async function toMatchStepSnapshot(
  this: any,
  receivedMaybePromise: string | Uint8Array | Promise<string | Uint8Array>,
  testPath: string,
  pngName?: string,
  options?: StepSnapshotOptions,
): Promise<MatcherResult> {
  try {
    const stepContent = await receivedMaybePromise
    const { glb, bbox } = await convertStepToGlb(stepContent, {
      chordTolerance: options?.chordTolerance,
      angleTolerance: options?.angleTolerance,
    })
    const png = await renderGlbToPng(glb, bbox, {
      width: options?.width,
      height: options?.height,
      background: options?.background,
    })
    return await expect(png).toMatchPngSnapshot(testPath, pngName)
  } catch (error) {
    return {
      message: () => `Failed to create STEP snapshot: ${error}`,
      pass: false,
    }
  }
}

expect.extend({
  toMatchStepSnapshot: toMatchStepSnapshot as any,
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchStepSnapshot(
      testPath: string,
      pngName?: string,
      options?: StepSnapshotOptions,
    ): Promise<MatcherResult>
  }
}

export async function cleanupStepSnapshot() {
}
