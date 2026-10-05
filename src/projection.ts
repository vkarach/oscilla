import type { Circle } from "./circle";
import type { Point } from "./geometry";
import { computePosition, type Oscillation } from "./oscillation";

export interface Projection {
    horizontal: Oscillation;
    vertical: Oscillation;
    circle: Circle;
}

export function projectionPoint(projection: Projection, timeSeconds: number): Point {
    return { 
        x: computePosition(projection.horizontal, timeSeconds).x, 
        y: computePosition(projection.vertical, timeSeconds).y 
    }
}
