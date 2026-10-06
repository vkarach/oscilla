import type { Point } from "./geometry";
import { computePosition, type Oscillation } from "./oscillation";

export interface ProjectionStyle {
    lineWidth: number
    color: string
}

export interface Projection {
    horizontal: Oscillation;
    vertical: Oscillation;
    style: ProjectionStyle;
}

export function projectionPoint(projection: Projection, timeSeconds: number): Point {
    return { 
        x: computePosition(projection.horizontal, timeSeconds).x, 
        y: computePosition(projection.vertical, timeSeconds).y 
    }
}

export function trailTimeStep(projection: Projection, stepPx: number): number {
    return stepPx / Math.hypot(maxSpeed(projection.horizontal), maxSpeed(projection.vertical))
}

function maxSpeed(o: Oscillation): number {
    return 2 * Math.PI * o.frequencyHz * o.amplitude
}

