import clickUrl from "./worklets/click.ts?worker&url"

import type { ClickOptions, ClickTiming } from "./worklets/clickOptions"
import type { Projection } from "./projection";
import type { Clock } from "./clock";

export interface Sound {
    toggle(): Promise<void>
}

export function createSound(clock: Clock, projection: Projection): Sound {
    const ctx = new AudioContext()
    
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(ctx.destination)
    
    let playing = false
    
    let nodeReady: Promise<AudioWorkletNode[]> | undefined
    const volume = 2
    const fadeSeconds = 0.02

    async function toggle() {
        nodeReady ??= createClickNodes(ctx, gain, clock, projection)
        const nodes = await nodeReady

        playing = !playing
        if (playing) {
            await ctx.resume()
            // The audio clock only maps to real time once the context runs.
            for (const node of nodes) postTiming(node, ctx, clock)
            gain.gain.setTargetAtTime(volume, ctx.currentTime, fadeSeconds)
        } 
        else {
            gain.gain.setTargetAtTime(0, ctx.currentTime, fadeSeconds)
            await delay(fadeSeconds * 5)
            if (!playing) await ctx.suspend()
        }
    }

    return { toggle };
}

function delay(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

async function createClickNodes(ctx: AudioContext, gain: GainNode, clock: Clock, projection: Projection): Promise<AudioWorkletNode[]> {
    await ctx.audioWorklet.addModule(clickUrl)
    const nodes: AudioWorkletNode[] = []
    nodes.push(createClickNode(ctx, gain, clock, projection.horizontal.frequencyHz))
    nodes.push(createClickNode(ctx, gain, clock, projection.vertical.frequencyHz))
    return nodes
}

function createClickNode(ctx: AudioContext, gain: GainNode, clock: Clock, frequencyHz: number): AudioWorkletNode {
    const options: ClickOptions = { frequencyHz }
    const node = new AudioWorkletNode(ctx, "click", { processorOptions: options })

    const ringHz = 1500
    const ringQ = 0.7

    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = ringHz
    filter.Q.value = ringQ
    node.connect(filter)
    filter.connect(gain)

    clock.onAnchorChange(() => {
        postTiming(node, ctx, clock)
    })
    return node
}

function postTiming(node: AudioWorkletNode, ctx: AudioContext, clock: Clock) {
    const { simSeconds, timeScale, realMs } = clock.anchor()
    const timing: ClickTiming = { simSeconds, timeScale, audioTime: audioTimeAt(ctx, realMs) }
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
