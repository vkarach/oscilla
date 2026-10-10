import type { Phase } from "../phase"

export interface ClickTiming {
    simSeconds: number
    timeScale: number
    audioTime: number
    phase: Phase
}
