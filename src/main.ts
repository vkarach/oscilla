import "./style.css";
import { createSurface } from "./canvas";
import { renderScene } from "./render";
import { createControls } from "./controls"
import { createScene } from "./scene";
import { createTrail } from "./trail";
import { createClock } from "./clock";
import { createSound } from "./sound";
import { createTheme } from "./theme";

function getRootElement(): HTMLDivElement {
    const element = document.querySelector<HTMLDivElement>("#app");
    if (!element) {
        throw new Error("Root element #app not found");
    }
    return element;
}

const app = getRootElement();
const scene = createScene()
const theme = createTheme()
app.style.background = theme.background
const trail = createTrail(app, scene.projection, theme)
const surface = createSurface(app);
const clock = createClock(scene.timeScale)
const sound = createSound(clock, scene.projection)

// rAF stops in a hidden tab while audio keeps running, so freeze scene time to keep them in step.
document.addEventListener("visibilitychange", () => clock.setPaused(document.hidden))

createControls(
    app, 
    { onToggleTrail: trail.toggle, onToggleSound: sound.toggle, onTimeScaleChange: clock.setTimeScale },
    scene.timeScale
)


function renderFrame(timeMs: number): void {
    const timeSeconds = clock.tick(timeMs)

    renderScene(surface, scene, theme, timeSeconds, clock.anchor().timeScale)
    trail.render(timeSeconds)

    requestAnimationFrame(renderFrame);
}
requestAnimationFrame(renderFrame);
