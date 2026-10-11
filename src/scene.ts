import type { Oscillation } from "./oscillation";
import { retune } from "./phase";
import type { Lissajous } from "./lissajous";
import type { Body } from "./body";

export interface Scene {
    timeScale: number
    bodies: Body[]
    lissajous: Lissajous
    changeFHz: (fHz: number, axis: "x" | "y", atSeconds: number) => void
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

    const horizontal: Oscillation = { center: { x: 450, y: 100, z: 0 }, axis: "x", amplitude: 200, frequencyHz: 2, phaseOffset: 0 }
    const vertical: Oscillation   = { center: { x: 200, y: 350, z: 0 }, axis: "y", amplitude: 200, frequencyHz: 5, phaseOffset: 0 }

    const bodies: Body[] = [
        { oscillation: horizontal },
        { oscillation: vertical },
    ];

    const lissajous: Lissajous = { horizontal, vertical }


    function changeFHz(fHz: number, axis: "x" | "y", atSeconds: number) {
        retune(axis == "x" ? lissajous.horizontal : lissajous.vertical, fHz, atSeconds)
        notifyChange()
    }

    return { timeScale, bodies, lissajous: lissajous, changeFHz, onChange }
}
