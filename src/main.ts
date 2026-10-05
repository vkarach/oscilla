import "./style.css";
import { createSurface } from "./canvas";
import { drawCircle, drawPath } from "./draw";
import { computePosition, type Oscillation } from "./oscillation";
import { projectionPoint, type Projection } from "./projection"

import type { Body } from "./body";

function getRootElement(): HTMLDivElement {
    const element = document.querySelector<HTMLDivElement>("#app");
    if (!element) {
        throw new Error("Root element #app not found");
    }
    return element;
}

const app = getRootElement();
const surface = createSurface(app)
const ctx = surface.ctx

const timeScale = 1;

const horizontal: Oscillation = { center: { x: 350, y: 200 }, axis: "x", amplitude: 100, frequencyHz: 0.5 }
const vertical: Oscillation   = { center: { x: 200, y: 350 }, axis: "y", amplitude: 100, frequencyHz: 1 }

const bodies: Body[] = [
    { oscillation: horizontal, circle: { radius: 10, color: "#000" } },
    { oscillation: vertical,   circle: { radius: 10, color: "#000" } },
];

const projection: Projection = { 
    horizontal: horizontal,
    vertical: vertical,  
    circle: { radius: 10, color: "#c74d4d" }
}

function renderFrame(timeMs: number): void {
    ctx.clearRect(0, 0, surface.width, surface.height)

    const timeSeconds = timeMs / 1000 * timeScale;
    for (const body of bodies) {
        const pos = computePosition(body.oscillation, timeSeconds);
        drawPath(ctx, body.oscillation)
        drawCircle(ctx, body.circle, pos);
    }

    drawCircle(ctx, projection.circle, projectionPoint(projection, timeSeconds))

    requestAnimationFrame(renderFrame);
}
requestAnimationFrame(renderFrame);
