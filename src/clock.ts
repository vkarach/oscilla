export interface ClockAnchor {
    simSeconds: number
    timeScale: number
    realMs: number
}

export interface Clock {
    anchor(): ClockAnchor
    tick(timeMs: number): number
    setTimeScale(scale: number): void
    setPaused(paused: boolean): void
    onAnchorChange(callback: () => void): void
}

export function createClock(timeScale: number): Clock {
    let simSeconds = 0
    let lastMs: number | undefined = undefined
    let paused = false

    function advanceTo(timeMs: number): void {
        if (lastMs !== undefined) {
            const dtReal = (timeMs - lastMs) / 1000
            if (dtReal <= 0) return
            if (!paused) simSeconds += dtReal * timeScale
        }
        lastMs = timeMs
    }

    function anchor(): ClockAnchor {
        return { simSeconds, timeScale: paused ? 0 : timeScale, realMs: lastMs ?? performance.now() }
    }

    function tick(timeMs: number): number {
        advanceTo(timeMs)
        return simSeconds
    }

    // Changes close the current segment at the real moment they happen so listeners get an exact anchor.
    function setTimeScale(scale: number): void {
        advanceTo(performance.now())
        timeScale = scale
        notifyAnchorChange()
    }

    function setPaused(value: boolean): void {
        if (value === paused) return
        advanceTo(performance.now())
        paused = value
        notifyAnchorChange()
    }

    const anchorListeners: (() => void)[] = []
    function onAnchorChange(callback: () => void) {
        anchorListeners.push(callback)
    }

    function notifyAnchorChange(): void {
        for (const listener of anchorListeners) listener()
    }

    return { anchor, onAnchorChange, tick, setTimeScale, setPaused }
}
