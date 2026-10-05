import "./style.css";
import { createCanvasContext } from "./canvas";
import { drawCircle } from "./draw";
import { computePosition } from "./oscillation";
import type { Body } from "./body";

function getRootElement(): HTMLDivElement {
    const element = document.querySelector<HTMLDivElement>("#app");
    if (!element) {
        throw new Error("Root element #app not found");
    }
    return element;
}

const app = getRootElement();
const ctx = createCanvasContext(app);

const timeScale = 1;

const bodies: Body[] = [
    { oscillation: { center: { x: 600, y: 200 }, axis: "x", amplitude: 100, frequencyHz: 0.5 }, circle: { radius: 10, color: "#000" } },
    { oscillation: { center: { x: 200, y: 300 }, axis: "y", amplitude: 100, frequencyHz: 1 },   circle: { radius: 10, color: "#000" } },
];

function renderFrame(timeMs: number): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const timeSeconds = timeMs / 1000 * timeScale;
    for (const body of bodies) {
        const pos = computePosition(body.oscillation, timeSeconds);
        drawCircle(ctx, body.circle, pos);
    }

    requestAnimationFrame(renderFrame);
}
requestAnimationFrame(renderFrame);
