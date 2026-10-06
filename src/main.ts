import "./style.css";
import { createSurface } from "./canvas";
import { drawCircle, drawPath } from "./draw";
import { computePosition } from "./oscillation";
import { projectionPoint } from "./projection"
import { createControls } from "./controls"
import { createScene } from "./scene";
import { createTrail } from "./trail";

function getRootElement(): HTMLDivElement {
    const element = document.querySelector<HTMLDivElement>("#app");
    if (!element) {
        throw new Error("Root element #app not found");
    }
    return element;
}

const app = getRootElement();
const scene = createScene()
const trail = createTrail(app, scene.projection)
const surface = createSurface(app);

createControls(app, { onToggleTrail: trail.toggle })

function renderFrame(timeMs: number): void {
    surface.ctx.clearRect(0, 0, surface.width, surface.height)

    const timeSeconds = timeMs / 1000 * scene.timeScale;
    for (const body of scene.bodies) {
        const pos = computePosition(body.oscillation, timeSeconds);
        drawPath(surface.ctx, body.oscillation)
        drawCircle(surface.ctx, body.circle, pos);
    }
    
    trail.render(timeSeconds)

    drawCircle(surface.ctx, { radius: 10, color: "#000"}, projectionPoint(scene.projection, timeSeconds))

    requestAnimationFrame(renderFrame);
}
requestAnimationFrame(renderFrame);
