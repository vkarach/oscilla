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
