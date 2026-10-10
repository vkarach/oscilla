// Pure phase math, shared with the audio worklet.

export interface Phase {
    frequencyHz: number
    // In cycles; absorbs frequency changes so the phase stays continuous.
    phaseOffset: number
}

export function phaseCycles(phase: Phase, timeSeconds: number): number {
    return phase.frequencyHz * timeSeconds + phase.phaseOffset
}

export function retune(phase: Phase, frequencyHz: number, atSeconds: number): void {
    phase.phaseOffset = phaseCycles(phase, atSeconds) - frequencyHz * atSeconds
    phase.frequencyHz = frequencyHz
}
