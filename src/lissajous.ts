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

// Corners of the box the figure fills; corner i takes its x, y, z side from bits 0, 1, 2.
export function lissajousCorners(lissajous: Lissajous): Point3[] {
    const { x, y, z } = lissajous
    return Array.from({ length: 8 }, (_, i) => ({
        x: x.center.x + (i & 1 ? 1 : -1) * x.amplitude,
        y: y.center.y + (i & 2 ? 1 : -1) * y.amplitude,
        z: z.center.z + (i & 4 ? 1 : -1) * z.amplitude,
    }))
}

// Distance from the world origin to the farthest corner, which bounds the figure and its rails from every view.
export function lissajousRadius(lissajous: Lissajous): number {
    return Math.max(...lissajousCorners(lissajous).map((p) => Math.hypot(p.x, p.y, p.z)))
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

