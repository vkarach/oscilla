import "./style.css";
import { createSurface } from "./canvas";
import { drawCircle, drawPath, drawTrailSegment } from "./draw";
import { computePosition } from "./oscillation";
import { projectionPoint, trailPeriod, trailTimeStep } from "./projection"
import { createControls } from "./controls"
import { createScene } from "./scene";

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

const scene = createScene()

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

const dt = trailTimeStep(scene.projection, 1.5)
const trailPeriodSec = trailPeriod(scene.projection)
let trailComplete = false

function renderFrame(timeMs: number): void {
    ctx.clearRect(0, 0, surface.width, surface.height)

    const timeSeconds = timeMs / 1000 * scene.timeScale;
    for (const body of scene.bodies) {
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
        drawTrailSegment(trailCtx, scene.projection, trailsStartSec, endT, dt)
        trailComplete = endT < timeSeconds
    }
    drawCircle(ctx, { radius: 10, color: "#000"}, projectionPoint(scene.projection, timeSeconds))

    requestAnimationFrame(renderFrame);
}
requestAnimationFrame(renderFrame);
