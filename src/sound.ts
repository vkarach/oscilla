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
    
    let nodeReady: Promise<AudioWorkletNode[]> | undefined

    async function toggle() {
        nodeReady ??= createClickNodes(ctx, gain, clock, projection)        
        await nodeReady

        await ctx.resume()
        playing = !playing
        gain.gain.setTargetAtTime(playing ? 0.1 : 0, ctx.currentTime, 0.02)
    }

    return { toggle };
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
