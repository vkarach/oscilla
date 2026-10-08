export interface Clock {
    now(): number
    tick(timeMs: number): number
    getTimeScale(): number
    setTimeScale(scale: number): void
    onTimeScaleChange(callback: (timeScale: number) => void): void
}

export function createClock(timeScale: number): Clock {
    let simSeconds = 0
    let lastMs: number | undefined = undefined

    function now(): number {
        return simSeconds
    }

    function tick(timeMs: number): number {
        let dtReal = 0
        if (lastMs !== undefined) {
            dtReal = Math.min((timeMs - lastMs) / 1000, 0.1)
        }
        simSeconds += dtReal * timeScale
        lastMs = timeMs
        return simSeconds
    }

    function getTimeScale() {
        return timeScale
    }

    function setTimeScale(scale: number): void {
        timeScale = scale
        for (const callback of timeScaleListeners) {
            callback(timeScale)
        }
    }

    const timeScaleListeners: ((timeScale: number) => void)[] = []
    function onTimeScaleChange(callback: (timeScale: number) => void) {
        timeScaleListeners.push(callback)
    }

    return { getTimeScale, onTimeScaleChange, now, tick, setTimeScale }
}
