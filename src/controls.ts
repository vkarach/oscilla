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
    readonly trailOn: boolean
    readonly soundOn: boolean
}

export function createControls(parent: HTMLElement, handlers: ControlHandlers, initial: ControlState) {
    const controls = document.createElement("div")
    controls.className = "controls"
    parent.append(controls)

    controls.append(
        createToggle("trail", initial.trailOn, handlers.onToggleTrail),
        createToggle("sound", initial.soundOn, handlers.onToggleSound),
    )
    for (const axis of ["x", "y", "z"] as const) {
        controls.append(createFhzInput(axis, initial.frequencyHz[axis], (fHz) => handlers.onFHzChange(fHz, axis)))
    }
    controls.append(createSpeedSlider(initial.timeScale, handlers.onTimeScaleChange))
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

function formatScale(scale: number): string {
    const digits = scale >= 10 ? 0 : scale >= 1 ? 1 : 2
    return `${scale.toFixed(digits)}x`
}

function createToggle(label: string, on: boolean, onToggle: () => void): HTMLButtonElement {
    const button = document.createElement("button")
    button.className = "toggle"
    button.textContent = label
    button.setAttribute("aria-pressed", String(on))
    button.addEventListener("click", () => {
        on = !on
        button.setAttribute("aria-pressed", String(on))
        onToggle()
    })
    return button
}

function createField(name: string, accent: string): HTMLLabelElement {
    const field = document.createElement("label")
    field.className = "field"
    field.style.setProperty("--accent", accent)
    const caption = document.createElement("span")
    caption.className = "caption"
    caption.textContent = name
    field.append(caption)
    return field
}

function createFhzInput(axis: Axis, initialHz: number, onChange: (fHz: number) => void): HTMLLabelElement {
    const field = createField(axis, `var(--axis-${axis})`)
    const input = document.createElement("input")
    input.type = "number"
    input.required = true
    input.min = "1"
    input.value = String(initialHz)
    input.addEventListener("input", () => {
        if (input.checkValidity()) onChange(Number(input.value))
    })
    const unit = document.createElement("span")
    unit.className = "unit"
    unit.textContent = "Hz"
    field.append(input, unit)
    return field
}

function createSpeedSlider(initialScale: number, onChange: (timeScale: number) => void): HTMLLabelElement {
    const field = createField("speed", "var(--marker)")
    const slider = document.createElement("input")
    slider.type = "range"
    slider.min = "0"
    slider.max = "1"
    slider.step = "0.001"
    slider.value = String(scaleToSlider(initialScale))
    const readout = document.createElement("span")
    readout.className = "unit readout"
    readout.textContent = formatScale(initialScale)
    slider.addEventListener("input", () => {
        const scale = sliderToScale(Number(slider.value))
        readout.textContent = formatScale(scale)
        onChange(scale)
    })
    field.append(slider, readout)
    return field
}
