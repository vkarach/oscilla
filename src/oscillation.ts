import type { Point } from "./geometry";

export interface Oscillation {
    center: Point;
    axis: "x" | "y";
    amplitude: number;
    frequencyHz: number;
}

export function computePosition(oscillation: Oscillation, timeSeconds: number): Point {
    const offset =
        oscillation.amplitude * Math.sin(2 * Math.PI * oscillation.frequencyHz * timeSeconds);

    if (oscillation.axis === "x") {
        return { x: oscillation.center.x + offset, y: oscillation.center.y };
    }
    return { x: oscillation.center.x, y: oscillation.center.y + offset };
}

export function pathStart(oscillation: Oscillation): Point {
    if (oscillation.axis === "x") {
        return { x: oscillation.center.x - oscillation.amplitude, y: oscillation.center.y }
    }
    else {
        return { x: oscillation.center.x, y: oscillation.center.y - oscillation.amplitude }
    }
}

export function pathEnd(oscillation: Oscillation): Point {
    if (oscillation.axis === "x") {
        return { x: oscillation.center.x + oscillation.amplitude, y: oscillation.center.y }
    }
    else {
        return { x: oscillation.center.x, y: oscillation.center.y + oscillation.amplitude }
    }
}
