import "./style.css";
import { createSurface } from "./canvas";
import { renderScene } from "./render";
import { createControls } from "./controls"
import { createScene } from "./scene";
import { createTrail } from "./trail";
import { createClock } from "./clock";

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
const clock = createClock(scene.timeScale)
createControls(app, { onToggleTrail: trail.toggle, onTimeScaleChange: clock.setTimeScale }, scene.timeScale)


function renderFrame(timeMs: number): void {
    const timeSeconds = clock.tick(timeMs)

    renderScene(surface, scene, timeSeconds)
    trail.render(timeSeconds)

    requestAnimationFrame(renderFrame);
}
requestAnimationFrame(renderFrame);
