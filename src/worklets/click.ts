import type { ClickTiming } from "./clickTiming"
import { phaseCycles } from "../phase"

// Smoothing of a lone strike, short enough to keep the tick crisp.
const thumpSeconds = 0.00025
// Once ticks fuse, smoothing stretches with the tick gap so the tone keeps about this many harmonics instead of buzzing.
const fusedHarmonics = 4
const ringSeconds = 0.04
const ringLevel = 0.6
// Ticks faster than this are heard as one tone rather than as separate ticks.
const fuseHz = 20

class ClickProcessor extends AudioWorkletProcessor {
    private timing: ClickTiming = { simSeconds: 0, timeScale: 0, audioTime: 0, phase: { frequencyHz: 0, phaseOffset: 0 }, ringHz: 0 }
    private lastCrossings = 0
    private carry = 0
    private thump1 = 0
    private thump2 = 0
    private ring1 = 0
    private ring2 = 0

    constructor() {
        super()
        this.port.onmessage = (event: MessageEvent<ClickTiming>) => {
            this.timing = event.data
            this.lastCrossings = this.crossingsAt(currentTime)
        }
    }

    // Counts center crossings, two per cycle of the oscillation.
    private crossingsAt(audioTime: number): number {
        const { simSeconds, timeScale, audioTime: anchorTime, phase } = this.timing
        return 2 * phaseCycles(phase, simSeconds + (audioTime - anchorTime) * timeScale)
    }

    process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        const channel = outputs[0][0]
        const { timeScale, phase, ringHz } = this.timing
        const ticksPerSecond = 2 * Math.abs(phase.frequencyHz * timeScale)
        // Fused ticks add energy with their rate, so the level falls to keep loudness flat.
        const level = Math.min(1, Math.sqrt(fuseHz / ticksPerSecond))
        const fusion = 1 - 1 / (1 + (ticksPerSecond / fuseHz) ** 2)
        // A ring outlasting the gap between ticks would whistle, so it fades as ticks fuse.
        const ringWeight = ringLevel * (1 - fusion)
        // Strikes alternate in sign, so the fused tone sits at half the tick rate.
        const toneHz = ticksPerSecond / 2
        const fusedSeconds = Math.max(thumpSeconds, 1 / (2 * Math.PI * fusedHarmonics * toneHz))
        const smoothSeconds = thumpSeconds ** (1 - fusion) * fusedSeconds ** fusion

        // Two cascaded one-poles give a smooth bump; the gain scales its peak to 1.
        const thumpPole = 1 - Math.exp(-1 / (smoothSeconds * sampleRate))
        const thumpGain = Math.E / thumpPole
        // A two-pole resonator; scaling the input by sin(omega) gives its ring a peak of 1.
        const omega = 2 * Math.PI * ringHz / sampleRate
        const radius = Math.exp(-1 / (ringSeconds * sampleRate))
        const feedback = 2 * radius * Math.cos(omega)
        const ringGain = Math.sin(omega)

        for (let i = 0; i < channel.length; i++) {
            const crossings = this.crossingsAt(currentTime + i / sampleRate)

            let strike = this.carry
            this.carry = 0
            const crossing = Math.floor(crossings)
            if (crossing !== Math.floor(this.lastCrossings)) {
                // The ball crosses in turn going one way and the other, so strikes alternate in sign.
                const sign = crossing % 2 === 0 ? 1 : -1
                // Split the impulse across two samples so its timing is not snapped to the sample grid.
                const samplesSinceCrossing = Math.min(1, (crossings - crossing) / (crossings - this.lastCrossings))
                strike += sign * samplesSinceCrossing
                this.carry = sign * (1 - samplesSinceCrossing)
            }
            this.lastCrossings = crossings

            this.thump1 += (thumpGain * strike - this.thump1) * thumpPole
            this.thump2 += (this.thump1 - this.thump2) * thumpPole
            const ring = ringGain * strike + feedback * this.ring1 - radius * radius * this.ring2
            this.ring2 = this.ring1
            this.ring1 = ring

            // Scaled so a strike peaks at most at 1, however its thump and ring line up.
            channel[i] = level * (this.thump2 + ringWeight * ring) / (1 + ringLevel)
        }
        return true
    }
}

registerProcessor("click", ClickProcessor);
