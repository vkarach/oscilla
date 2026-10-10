import "./style.css";
import { createSurface } from "./canvas";
import { createRenderer } from "./render";
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
const renderer = createRenderer(surface)
const clock = createClock(scene.timeScale)
const sound = createSound(clock, scene.projection)

// rAF stops in a hidden tab while audio keeps running, so freeze scene time to keep them in step.
document.addEventListener("visibilitychange", () => clock.setPaused(document.hidden))
scene.onChange(trail.restart)
scene.onChange(sound.sync)

createControls(
    app, 
    { 
        onToggleTrail: trail.toggle, 
        onToggleSound: sound.toggle, 
        onTimeScaleChange: clock.setTimeScale,
        onFHzChange: (fHz, axis) => scene.changeFHz(fHz, axis, clock.anchor().simSeconds)
    },
    {
        timeScale: scene.timeScale,
        frequencyHz: { x: scene.projection.horizontal.frequencyHz, y: scene.projection.vertical.frequencyHz },
    }
)


let lastSimSeconds = 0
function renderFrame(timeMs: number): void {
    const simSeconds = clock.tick(timeMs)

    renderer.render(scene, theme, {
        simSeconds,
        timeScale: clock.anchor().timeScale,
        frameSimSeconds: simSeconds - lastSimSeconds,
    })
    trail.render(simSeconds)
    lastSimSeconds = simSeconds

    requestAnimationFrame(renderFrame);
}
requestAnimationFrame(renderFrame);
