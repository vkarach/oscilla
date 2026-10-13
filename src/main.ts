import "./style.css";
import { createSurface } from "./canvas";
import { createRenderer } from "./render";
import { createControls } from "./controls"
import { createScene } from "./scene";
import { createTrail } from "./trail";
import { createClock } from "./clock";
import { createSound } from "./sound";
import { applyThemeVariables, createTheme } from "./theme";
import { createCamera, orbitControls } from "./camera";
import { lissajousRadius } from "./lissajous";

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
applyThemeVariables(app, theme)
const camera = createCamera(0.6, -0.4, lissajousRadius(scene.lissajous))
const trail = createTrail(app, scene.lissajous, theme, camera)
const surface = createSurface(app);
const renderer = createRenderer(surface)
const clock = createClock(scene.timeScale)
const sound = createSound(clock, scene.lissajous)
sound.playOnFirstGesture()

// rAF stops in a hidden tab while audio keeps running, so freeze scene time to keep them in step.
document.addEventListener("visibilitychange", () => clock.setPaused(document.hidden))
scene.onChange(trail.restart)
scene.onChange(sound.sync)
camera.onChange(trail.redraw)
surface.onResize(() => camera.setViewport(surface.width, surface.height))
orbitControls(surface.ctx.canvas, camera)

const controls = createControls(
    app,
    { 
        onToggleTrail: trail.toggle, 
        onToggleSound: sound.toggle, 
        onTimeScaleChange: clock.setTimeScale,
        onFHzChange: (fHz, axis) => scene.changeFHz(fHz, axis, clock.anchor().simSeconds)
    },
    {
        timeScale: scene.timeScale,
        frequencyHz: { 
            x: scene.lissajous.x.frequencyHz,
            y: scene.lissajous.y.frequencyHz, 
            z: scene.lissajous.z.frequencyHz
        },
        trailOn: true,
        soundOn: sound.isAudible(),
    }
)
sound.onChange(() => controls.setSoundOn(sound.isAudible()))


let lastSimSeconds = 0
function renderFrame(timeMs: number): void {
    const simSeconds = clock.tick(timeMs)
    renderer.render(
        scene, 
        theme, 
        {
            simSeconds,
            timeScale: clock.anchor().timeScale,
            frameSimSeconds: simSeconds - lastSimSeconds,
        }, 
        camera
    )
    trail.render(simSeconds)
    lastSimSeconds = simSeconds

    requestAnimationFrame(renderFrame);
}
requestAnimationFrame(renderFrame);
