import clickUrl from "./worklets/click.ts?worker&url"

import type { ClickTiming } from "./worklets/clickTiming"
import type { Oscillation } from "./oscillation";
import type { Lissajous } from "./lissajous";
import type { Clock } from "./clock";
import type { Axis } from "./geometry";

export interface Sound {
    toggle(): Promise<void>
    sync(): void
    playOnFirstGesture(): void
    isAudible(): boolean
    onChange(callback: () => void): void
}

interface ClickVoice {
    sync(): void
}

export function createSound(clock: Clock, lissajous: Lissajous): Sound {
    const ctx = new AudioContext()

    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(ctx.destination)

    // Wanted by the user; audible lags behind it until the browser lets audio run.
    let playing = false
    let audible = false

    const voicesReady = createClickVoices(ctx, gain, clock, lissajous)
    // Each ball peaks at most at 1, so three striking at once still reach only full scale.
    const volume = 1 / 3
    const fadeSeconds = 0.02

    async function start(): Promise<void> {
        // Resumed before any await, while the gesture that allows audio is still current.
        const running = ctx.resume()
        const voices = await voicesReady
        await running
        if (!playing) return
        // The audio clock only maps to real time once the context runs.
        for (const voice of voices) voice.sync()
        gain.gain.setTargetAtTime(volume, ctx.currentTime, fadeSeconds)
        setAudible(true)
    }

    async function stop(): Promise<void> {
        setAudible(false)
        gain.gain.setTargetAtTime(0, ctx.currentTime, fadeSeconds)
        await delay(fadeSeconds * 5)
        if (!playing) await ctx.suspend()
    }

    // Flips what the user hears, so a click while audio still waits to unlock turns it on.
    async function toggle(): Promise<void> {
        playing = !audible
        await (playing ? start() : stop())
    }

    function setAudible(value: boolean): void {
        if (audible === value) return
        audible = value
        for (const callback of changeListeners) callback()
    }

    const changeListeners: (() => void)[] = []
    function onChange(callback: () => void): void {
        changeListeners.push(callback)
    }

    // Browsers keep audio locked until the user first interacts, so sound that is on from the start waits for that.
    function playOnFirstGesture(): void {
        playing = true
        const gesture = new AbortController()
        // Kept until audio runs, since not every gesture is one the browser accepts to unlock it.
        const unlock = () => {
            void start().finally(() => {
                if (audible || !playing) gesture.abort()
            })
        }
        for (const type of ["keydown", "mousedown", "pointerup", "touchend"]) {
            document.addEventListener(type, unlock, { signal: gesture.signal })
        }
    }

    function isAudible(): boolean {
        return audible
    }

    // Voices not created yet read the scene when they are.
    function sync(): void {
        void voicesReady.then((voices) => {
            for (const voice of voices) voice.sync()
        })
    }

    return { toggle, sync, playOnFirstGesture, isAudible, onChange };
}

function delay(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

// Each ball's own resonance, an A major triad so balls ticking together sound consonant.
const ringHz: Record<Axis, number> = { x: 440, y: 554.37, z: 659.26 }

async function createClickVoices(ctx: AudioContext, gain: GainNode, clock: Clock, lissajous: Lissajous): Promise<ClickVoice[]> {
    await ctx.audioWorklet.addModule(clickUrl)
    return Object.values(lissajous).map((oscillation) => createClickVoice(ctx, gain, clock, oscillation))
}

function createClickVoice(ctx: AudioContext, gain: GainNode, clock: Clock, oscillation: Oscillation): ClickVoice {
    const node = new AudioWorkletNode(ctx, "click")
    node.connect(gain)

    function sync(): void {
        postTiming(node, ctx, clock, oscillation)
    }

    sync()
    clock.onAnchorChange(sync)
    return { sync }
}

function postTiming(node: AudioWorkletNode, ctx: AudioContext, clock: Clock, oscillation: Oscillation) {
    const { simSeconds, timeScale, realMs } = clock.anchor()
    const { frequencyHz, phaseOffset, axis } = oscillation
    const timing: ClickTiming = { simSeconds, timeScale, audioTime: audioTimeAt(ctx, realMs), phase: { frequencyHz, phaseOffset }, ringHz: ringHz[axis] }
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
