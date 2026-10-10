import clickUrl from "./worklets/click.ts?worker&url"

import type { ClickTiming } from "./worklets/clickTiming"
import type { Oscillation } from "./oscillation";
import type { Projection } from "./projection";
import type { Clock } from "./clock";

export interface Sound {
    toggle(): Promise<void>
    sync(): void
}

interface ClickVoice {
    sync(): void
}

export function createSound(clock: Clock, projection: Projection): Sound {
    const ctx = new AudioContext()

    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(ctx.destination)

    let playing = false

    let voicesReady: Promise<ClickVoice[]> | undefined
    const volume = 2
    const fadeSeconds = 0.02

    async function toggle() {
        voicesReady ??= createClickVoices(ctx, gain, clock, projection)
        const voices = await voicesReady

        playing = !playing
        if (playing) {
            await ctx.resume()
            // The audio clock only maps to real time once the context runs.
            for (const voice of voices) voice.sync()
            gain.gain.setTargetAtTime(volume, ctx.currentTime, fadeSeconds)
        }
        else {
            gain.gain.setTargetAtTime(0, ctx.currentTime, fadeSeconds)
            await delay(fadeSeconds * 5)
            if (!playing) await ctx.suspend()
        }
    }

    // Voices not created yet read the scene when they are.
    function sync(): void {
        void voicesReady?.then((voices) => {
            for (const voice of voices) voice.sync()
        })
    }

    return { toggle, sync };
}

function delay(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

async function createClickVoices(ctx: AudioContext, gain: GainNode, clock: Clock, projection: Projection): Promise<ClickVoice[]> {
    await ctx.audioWorklet.addModule(clickUrl)
    return [
        createClickVoice(ctx, gain, clock, projection.horizontal),
        createClickVoice(ctx, gain, clock, projection.vertical),
    ]
}

function createClickVoice(ctx: AudioContext, gain: GainNode, clock: Clock, oscillation: Oscillation): ClickVoice {
    const node = new AudioWorkletNode(ctx, "click")

    const ringHz = 2500
    const ringQ = 1.5

    const filter = ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.value = ringHz
    filter.Q.value = ringQ
    node.connect(filter)
    
    const rateGain = ctx.createGain()
    rateGain.gain.value = gainMultiplier(oscillation.frequencyHz, clock.anchor().timeScale)
    filter.connect(rateGain)
    rateGain.connect(gain)

    function sync(): void {
        const { timeScale } = clock.anchor()
        postTiming(node, ctx, clock, oscillation)
        if (timeScale !== 0) {
            const multiplier = gainMultiplier(oscillation.frequencyHz, timeScale)
            rateGain.gain.setTargetAtTime(multiplier, ctx.currentTime, 0.02)
        }
        else {
            rateGain.gain.value = 0
        }
    }

    sync()
    clock.onAnchorChange(sync)
    return { sync }
}

function postTiming(node: AudioWorkletNode, ctx: AudioContext, clock: Clock, oscillation: Oscillation) {
    const { simSeconds, timeScale, realMs } = clock.anchor()
    const { frequencyHz, phaseOffset } = oscillation
    const timing: ClickTiming = { simSeconds, timeScale, audioTime: audioTimeAt(ctx, realMs), phase: { frequencyHz, phaseOffset } }
    node.port.postMessage(timing)
}

// Maps a performance.now() instant to the context time of the sample heard at that instant.
function audioTimeAt(ctx: AudioContext, realMs: number): number {
    const { contextTime, performanceTime } = ctx.getOutputTimestamp()
    if (!contextTime || !performanceTime) {
        return ctx.currentTime + (realMs - performance.now()) / 1000
    }
    return contextTime + (realMs - performanceTime) / 1000
}


function gainMultiplier(frequencyHz: number, timeScale: number): number {
    const crossingsPerPeriod = 2
    const fuseHz = 20
    const clickHz = crossingsPerPeriod * frequencyHz * timeScale
    return Math.min(1, Math.sqrt(fuseHz / clickHz))
}
