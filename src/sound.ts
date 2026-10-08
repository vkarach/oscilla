import clickUrl from "./worklets/click.ts?worker&url"

import type { ClickOptions } from "./worklets/clickOptions"
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
    
    let nodeReady: Promise<AudioWorkletNode> | undefined

    async function toggle() {
        nodeReady ??= createClickNode(ctx, gain, clock, projection.horizontal.frequencyHz)
        await nodeReady

        await ctx.resume()
        playing = !playing
        gain.gain.setTargetAtTime(playing ? 0.1 : 0, ctx.currentTime, 0.02)
    }

    return { toggle };
}

async function createClickNode(ctx: AudioContext, gain: GainNode, clock: Clock, frequencyHz: number): Promise<AudioWorkletNode> {
    await ctx.audioWorklet.addModule(clickUrl)
    const options: ClickOptions = { frequencyHz }
    const node = new AudioWorkletNode(ctx, "click", { processorOptions: options })
    node.connect(gain)

    postTiming(node, clock)

    clock.onTimeScaleChange(() => {
        postTiming(node, clock)
    })
    return node
}

function postTiming(node: AudioWorkletNode, clock: Clock) {
    node.port.postMessage({ timeScale: clock.getTimeScale(), simSeconds: clock.now() })
}
