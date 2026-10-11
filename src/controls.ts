import type { Axis } from "./geometry"

export interface ControlHandlers {
    onToggleTrail: () => void
    onToggleSound: () => void
    onFHzChange: (fHz: number, axis: Axis) => void
    onTimeScaleChange: (timeScale: number) => void
}

export interface ControlState {
    readonly timeScale: number
    readonly frequencyHz: Readonly<Record<Axis, number>>
}

export function createControls(parent: HTMLElement, handlers: ControlHandlers, initial: ControlState) {
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

    for (const axis of ["x", "y", "z"] as const) {
        controls.append(createFhzInput(initial.frequencyHz[axis], (fHz) => handlers.onFHzChange(fHz, axis)))
    }

    const slider = document.createElement("input")
    slider.type = "range"
    slider.min = "0"
    slider.max = "1"
    slider.step = "0.001"
    slider.value = String(scaleToSlider(initial.timeScale))
    controls.append(slider)
    slider.addEventListener("input", () => {
        handlers.onTimeScaleChange(sliderToScale(Number(slider.value)))
    })
}

// A fixed range keeps speed independent of the frequencies.
const minScale = 0.01
const maxScale = 200

function sliderToScale(value: number): number {
    return minScale * (maxScale / minScale) ** value
}

function scaleToSlider(scale: number): number {
    return Math.log(scale / minScale) / Math.log(maxScale / minScale)
}

function createFhzInput(initialHz: number, onChange: (fHz: number) => void): HTMLInputElement {
    const fHzInput = document.createElement("input")
    fHzInput.style.width = "5ch"
    fHzInput.type = "number"
    fHzInput.required = true
    fHzInput.value = String(initialHz)
    fHzInput.min = "1"
    fHzInput.addEventListener(
        "input",
        () => {
            if (fHzInput.checkValidity()) onChange(Number(fHzInput.value))
        }
    )
    return fHzInput
}
