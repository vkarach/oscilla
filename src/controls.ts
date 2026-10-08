export interface ControlHandlers {
    onToggleTrail: () => void
    onToggleSound: () => void
    onTimeScaleChange: (timeScale: number) => void
}

export function createControls(parent: HTMLElement, handlers: ControlHandlers, timeScale: number) {
    const controls = document.createElement("div")
    controls.className = "controls"
    parent.append(controls)

    const trailToggleBtn = document.createElement("button");
    trailToggleBtn.textContent = "trail"
    trailToggleBtn.addEventListener("click", handlers.onToggleTrail);
    controls.append(trailToggleBtn)

    const soundToggleBtn = document.createElement("button");
    soundToggleBtn.textContent = "sound"
    soundToggleBtn.addEventListener("click", handlers.onToggleSound);
    controls.append(soundToggleBtn)


    const slider = document.createElement("input")
    slider.type = "range"
    slider.min = "0"
    slider.max = "1"
    slider.step = "0.001"
    controls.append(slider)
    slider.addEventListener("input", () => {
        handlers.onTimeScaleChange(sliderToScale(Number(slider.value)))
    })
    slider.value = String(scaleToSlider(timeScale))
}

const minScale = 0.01
const maxScale = 200

function sliderToScale(value: number): number {
    return minScale * (maxScale / minScale) ** value
}

function scaleToSlider(scale: number): number {
    return Math.log(scale / minScale) / Math.log(maxScale / minScale)
}
