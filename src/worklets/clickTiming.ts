import type { Phase } from "../phase"

export interface ClickTiming {
    simSeconds: number
    timeScale: number
    audioTime: number
    phase: Phase
    // The ball's own resonance, heard as the note of a single tick.
    ringHz: number
}
