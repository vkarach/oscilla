import type { Point } from "./geometry";
import { computePosition, type Oscillation } from "./oscillation";

export interface Projection {
    horizontal: Oscillation;
    vertical: Oscillation;
}

export function projectionPoint(projection: Projection, timeSeconds: number): Point {
    return { 
        x: computePosition(projection.horizontal, timeSeconds).x, 
        y: computePosition(projection.vertical, timeSeconds).y 
    }
}

function maxSpeed(o: Oscillation): number {
    return 2 * Math.PI * o.frequencyHz * o.amplitude
}

export function trailTimeStep(projection: Projection, stepPx: number): number {
    return stepPx / Math.hypot(maxSpeed(projection.horizontal), maxSpeed(projection.vertical))
}

function gcd(a: number, b: number): number {
    return b < 1e-6 ? a : gcd(b, a % b)
}

export function trailPeriod(projection: Projection): number {
    return 1 / gcd(projection.horizontal.frequencyHz, projection.vertical.frequencyHz)
}

