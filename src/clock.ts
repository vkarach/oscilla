export interface Clock {
    tick(timeMs: number): number
    setTimeScale(scale: number): void
}

export function createClock(timeScale: number): Clock {
    let simSeconds = 0
    let lastMs: number | undefined = undefined

    function tick(timeMs: number): number {
        let dtReal = 0
        if (lastMs !== undefined) {
            dtReal = Math.min((timeMs - lastMs) / 1000, 0.1)
        }
        simSeconds += dtReal * timeScale
        lastMs = timeMs
        return simSeconds
    }

    function setTimeScale(scale: number): void {
        timeScale = scale
    }

    return { tick, setTimeScale }
}
