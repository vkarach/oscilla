import type { Axis, Point3 } from "./geometry";
import { phaseCycles, type Phase } from "./phase";

export interface Oscillation extends Phase {
    center: Point3;
    axis: Axis;
    amplitude: number;
}

export function computePosition(oscillation: Oscillation, timeSeconds: number): Point3 {
    const offset =
        oscillation.amplitude * Math.sin(2 * Math.PI * phaseCycles(oscillation, timeSeconds));

    return alongAxis(oscillation, offset)
}

export function pathStart(oscillation: Oscillation): Point3 {
    return alongAxis(oscillation, -oscillation.amplitude)
}

export function pathEnd(oscillation: Oscillation): Point3 {
    return alongAxis(oscillation, oscillation.amplitude)
}

function alongAxis(o: Oscillation, offset: number): Point3 {
    return { ...o.center, [o.axis]: o.center[o.axis] + offset }
}
