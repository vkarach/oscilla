import type { Oscillation } from "./oscillation";
import { retune } from "./phase";
import type { Projection } from "./projection";
import type { Body } from "./body";

export interface Scene {
    timeScale: number
    bodies: Body[]
    projection: Projection
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

    const horizontal: Oscillation = { center: { x: 450, y: 100 }, axis: "x", amplitude: 200, frequencyHz: 2, phaseOffset: 0 }
    const vertical: Oscillation   = { center: { x: 200, y: 350 }, axis: "y", amplitude: 200, frequencyHz: 5, phaseOffset: 0 }

    const bodies: Body[] = [
        { oscillation: horizontal },
        { oscillation: vertical },
    ];

    const projection: Projection = { horizontal, vertical }


    function changeFHz(fHz: number, axis: "x" | "y", atSeconds: number) {
        retune(axis == "x" ? projection.horizontal : projection.vertical, fHz, atSeconds)
        notifyChange()
    }

    return { timeScale, bodies, projection, changeFHz, onChange }
}
