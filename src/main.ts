import "./style.css";
import { createSurface } from "./canvas";
import { drawCircle, drawPath, drawTrailSegment } from "./draw";
import { computePosition, type Oscillation } from "./oscillation";
import { projectionPoint, trailPeriod, trailTimeStep, type Projection } from "./projection"
import { createControls } from "./controls"

import type { Body } from "./body";

function getRootElement(): HTMLDivElement {
    const element = document.querySelector<HTMLDivElement>("#app");
    if (!element) {
        throw new Error("Root element #app not found");
    }
    return element;
}

const app = getRootElement();
const trailCtx = createSurface(app).ctx;
const surface = createSurface(app);
const ctx = surface.ctx;

let trailEnabled = true;
let trailJustEnabled = true;
let trailsStartSec = 0;
createControls(app, {
    onToggleTrail: () => {
        trailEnabled = !trailEnabled;
        trailJustEnabled = true
        trailCtx.canvas.hidden = !trailEnabled;
    },
});

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

const dt = trailTimeStep(projection, 1.5)
const trailPeriodSec = trailPeriod(projection)
let trailComplete = false

function renderFrame(timeMs: number): void {
    ctx.clearRect(0, 0, surface.width, surface.height)

    const timeSeconds = timeMs / 1000 * timeScale;
    for (const body of bodies) {
        const pos = computePosition(body.oscillation, timeSeconds);
        drawPath(ctx, body.oscillation)
        drawCircle(ctx, body.circle, pos);
    }
    
    if (trailJustEnabled) {
        trailsStartSec = timeSeconds
        trailComplete = false
        trailJustEnabled = false
    }
    if (trailEnabled && !trailComplete) {
        trailCtx.clearRect(0, 0, surface.width, surface.height)
        const endT = Math.min(timeSeconds, trailsStartSec + trailPeriodSec)
        drawTrailSegment(trailCtx, projection, trailsStartSec, endT, dt)
        trailComplete = endT < timeSeconds
    }
    drawCircle(ctx, { radius: 10, color: "#000"}, projectionPoint(projection, timeSeconds))

    requestAnimationFrame(renderFrame);
}
requestAnimationFrame(renderFrame);
