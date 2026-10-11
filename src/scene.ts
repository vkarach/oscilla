import { retune } from "./phase";
import type { Lissajous } from "./lissajous";
import type { Body } from "./body";
import type { Axis } from "./geometry";

export interface Scene {
    timeScale: number
    bodies: Body[]
    lissajous: Lissajous
    changeFHz: (fHz: number, axis: Axis, atSeconds: number) => void
    onChange: (callback: () => void) => void
}

export function createScene(): Scene {
    const changeListeners: (() => void)[] = []

    function onChange(callback: () => void): void {
        changeListeners.push(callback)
    }

    function notifyChange() {
        for (const callback of changeListeners) callback()
    }

    const timeScale = 0.2;

    const lissajous: Lissajous = {
        x: { center: { x: 0, y: -200, z: -200 }, axis: "x", amplitude: 200, frequencyHz: 2, phaseOffset: 0 },
        y: { center: { x: -200, y: 0, z: -200 }, axis: "y", amplitude: 200, frequencyHz: 4, phaseOffset: 0 },
        z: { center: { x: -200, y: -200, z: 0 }, axis: "z", amplitude: 200, frequencyHz: 6, phaseOffset: 0 }
    }

    const bodies: Body[] = Object.values(lissajous).map((oscillation) => ({ oscillation }))

    function changeFHz(fHz: number, axis: Axis, atSeconds: number) {
        retune(lissajous[axis], fHz, atSeconds)
        notifyChange()
    }

    return { timeScale, bodies, lissajous: lissajous, changeFHz, onChange }
}
