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

    const frequencyHz = { ...initial.frequencyHz }
    let timeScale = initial.timeScale

    for (const axis of ["x", "y", "z"] as const) {
        controls.append(createFhzInput(frequencyHz[axis], (fHz) => {
            frequencyHz[axis] = fHz
            handlers.onFHzChange(fHz, axis)
            const { min, max } = scaleRange(frequencyHz)
            const clamped = Math.min(max, Math.max(min, timeScale))
            if (clamped !== timeScale) {
                timeScale = clamped
                handlers.onTimeScaleChange(timeScale)
            }
            placeSlider()
        }))
    }

    const slider = document.createElement("input")
    slider.type = "range"
    slider.min = "0"
    slider.max = "1"
    slider.step = "0.001"
    controls.append(slider)
    slider.addEventListener("input", () => {
        timeScale = sliderToScale(Number(slider.value), scaleRange(frequencyHz))
        handlers.onTimeScaleChange(timeScale)
    })

    function placeSlider(): void {
        slider.value = String(scaleToSlider(timeScale, scaleRange(frequencyHz)))
    }
    placeSlider()
}

interface ScaleRange {
    min: number
    max: number
}

// Real cycles per second of the fastest body at the slider ends.
const slowestHz = 0.25
const fastestHz = 1000

function scaleRange(frequencyHz: Record<Axis, number>): ScaleRange {
    const top = Math.max(...Object.values(frequencyHz))
    return { min: slowestHz / top, max: fastestHz / top }
}

function sliderToScale(value: number, { min, max }: ScaleRange): number {
    return min * (max / min) ** value
}

function scaleToSlider(scale: number, { min, max }: ScaleRange): number {
    return Math.log(scale / min) / Math.log(max / min)
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
