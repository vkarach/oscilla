import type { ClickTiming } from "./clickTiming"
import { phaseCycles } from "../phase"

class ClickProcessor extends AudioWorkletProcessor {
    private timing: ClickTiming = { simSeconds: 0, timeScale: 0, audioTime: 0, phase: { frequencyHz: 0, phaseOffset: 0 } }
    private lastPhase = 0
    private carry = 0

    constructor() {
        super()
        this.port.onmessage = (event: MessageEvent<ClickTiming>) => {
            this.timing = event.data
            this.lastPhase = this.phaseAt(currentTime)
        }
    }

    // Counts center crossings, two per cycle of the oscillation.
    private phaseAt(audioTime: number): number {
        const { simSeconds, timeScale, audioTime: anchorTime, phase } = this.timing
        return 2 * phaseCycles(phase, simSeconds + (audioTime - anchorTime) * timeScale)
    }

    process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        const channel = outputs[0][0]
        for (let i = 0; i < channel.length; i++) {
            const phase = this.phaseAt(currentTime + i / sampleRate)

            let out = this.carry
            this.carry = 0
            const crossing = Math.floor(phase)
            if (crossing !== Math.floor(this.lastPhase)) {
                // Split the impulse across two samples so its timing is not snapped to the sample grid.
                const samplesSinceCrossing = Math.min(1, (phase - crossing) / (phase - this.lastPhase))
                out += samplesSinceCrossing
                this.carry = 1 - samplesSinceCrossing
            }
            this.lastPhase = phase
            channel[i] = out
        }
        return true
    }
}

registerProcessor("click", ClickProcessor);
