import type { Oscillation } from "./oscillation";
import type { Projection } from "./projection";
import type { Body } from "./body";

export interface Scene { 
    timeScale: number
    bodies: Body[]
    projection: Projection 
}

export function createScene(): Scene {
    const timeScale = 0.2;
    
    const horizontal: Oscillation = { center: { x: 450, y: 100 }, axis: "x", amplitude: 200, frequencyHz: 4 }
    const vertical: Oscillation   = { center: { x: 200, y: 350 }, axis: "y", amplitude: 200, frequencyHz: 5 }

    const bodies: Body[] = [
        { oscillation: horizontal },
        { oscillation: vertical },
    ];

    const projection: Projection = { horizontal, vertical }

    return { timeScale, bodies, projection }
}
