import type { Axis, Point3 } from "./geometry";
import { computePosition, type Oscillation } from "./oscillation";

export type Lissajous = Record<Axis, Oscillation>

export function lissajousPoint(lissajous: Lissajous, timeSeconds: number): Point3 {
    return {
        x: computePosition(lissajous.x, timeSeconds).x,
        y: computePosition(lissajous.y, timeSeconds).y,
        z: computePosition(lissajous.z, timeSeconds).z
    }
}

function maxSpeed(o: Oscillation): number {
    return 2 * Math.PI * o.frequencyHz * o.amplitude
}

export function trailTimeStep(lissajous: Lissajous, stepPx: number): number {
    return stepPx / Math.hypot(...Object.values(lissajous).map(maxSpeed))
}

function gcd(a: number, b: number): number {
    return b < 1e-6 ? a : gcd(b, a % b)
}

export function trailPeriod(lissajous: Lissajous): number {
    const frequencies = Object.values(lissajous).map((o) => o.frequencyHz)
    return 1 / frequencies.reduce(gcd)
}

