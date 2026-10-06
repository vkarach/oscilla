import type { Oscillation } from "./oscillation";
import type { Projection } from "./projection";
import type { Body } from "./body";

export interface Scene { 
    timeScale: number
    bodies: Body[]
    projection: Projection 
}

export function createScene(): Scene {
    const timeScale = 0.5;
    
    const horizontal: Oscillation = { center: { x: 350, y: 200 }, axis: "x", amplitude: 100, frequencyHz: 2 }
    const vertical: Oscillation   = { center: { x: 200, y: 350 }, axis: "y", amplitude: 100, frequencyHz: 3 }

    const bodies: Body[] = [
        { oscillation: horizontal, circle: { radius: 10, color: "#000" } },
        { oscillation: vertical,   circle: { radius: 10, color: "#000" } },
    ];
    
    const projection: Projection = { 
        horizontal: horizontal,
        vertical: vertical,  
        style: { lineWidth: 4, color: "#c74d4d" }
    }

    return { timeScale, bodies, projection }
}
