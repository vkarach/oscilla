import type { Point3 } from "./geometry";
import { computePosition, type Oscillation } from "./oscillation";

export interface Lissajous {
    horizontal: Oscillation;
    vertical: Oscillation;
}

export function lissajousPoint(lissajous: Lissajous, timeSeconds: number): Point3 {
    return { 
        x: computePosition(lissajous.horizontal, timeSeconds).x, 
        y: computePosition(lissajous.vertical, timeSeconds).y, 
        z: 0
    }
}

function maxSpeed(o: Oscillation): number {
    return 2 * Math.PI * o.frequencyHz * o.amplitude
}

export function trailTimeStep(lissajous: Lissajous, stepPx: number): number {
    return stepPx / Math.hypot(maxSpeed(lissajous.horizontal), maxSpeed(lissajous.vertical))
}

function gcd(a: number, b: number): number {
    return b < 1e-6 ? a : gcd(b, a % b)
}

export function trailPeriod(lissajous: Lissajous): number {
    return 1 / gcd(lissajous.horizontal.frequencyHz, lissajous.vertical.frequencyHz)
}

