import type { Point, Point3 } from "./geometry";

export interface Camera {
    project(p: Point3): Point
    rotate(yawDelta: number, pitchDelta: number): void
    zoom(factor: number): void
    pixelsPerUnit(): number
    setViewport(width: number, height: number): void
    onChange(callback: () => void): void
}

// Orbits the world origin and drops depth, so the origin lands in the middle of the viewport.
export function createCamera(yaw: number, pitch: number, fitRadius: number): Camera {
    const marginPx = 24
    const minZoom = 0.5
    const maxZoom = 10
    let center: Point = { x: 0, y: 0 }
    let fitScale = 1
    let zoomLevel = 1
    // Cached since project runs for every sample of every curve each frame.
    let cosYaw = Math.cos(yaw)
    let sinYaw = Math.sin(yaw)
    let cosPitch = Math.cos(pitch)
    let sinPitch = Math.sin(pitch)

    function project(p: Point3): Point {
        const scale = pixelsPerUnit()
        const x = p.x * cosYaw + p.z * sinYaw
        const z = -p.x * sinYaw + p.z * cosYaw
        const y = p.y * cosPitch - z * sinPitch
        return { x: center.x + scale * x, y: center.y + scale * y }
    }

    function rotate(yawDelta: number, pitchDelta: number): void {
        yaw += yawDelta
        pitch += pitchDelta
        cosYaw = Math.cos(yaw)
        sinYaw = Math.sin(yaw)
        cosPitch = Math.cos(pitch)
        sinPitch = Math.sin(pitch)
        notifyChange()
    }

    function zoom(factor: number): void {
        zoomLevel = Math.min(maxZoom, Math.max(minZoom, zoomLevel * factor))
        notifyChange()
    }

    function pixelsPerUnit(): number {
        return fitScale * zoomLevel
    }

    function setViewport(width: number, height: number): void {
        center = { x: width / 2, y: height / 2 }
        // Shrinks only when a sphere of fitRadius would leave the viewport, so large screens keep 1 px per unit.
        fitScale = Math.min(1, Math.max(0, Math.min(width, height) / 2 - marginPx) / fitRadius)
        notifyChange()
    }

    const changeListeners: (() => void)[] = []
    function onChange(callback: () => void): void {
        changeListeners.push(callback)
    }

    function notifyChange(): void {
        for (const callback of changeListeners) callback()
    }

    return { project, rotate, zoom, pixelsPerUnit, setViewport, onChange }
}

// One pointer turns the view, two pinch to zoom, and the wheel zooms too.
export function orbitControls(element: HTMLElement, camera: Camera): void {
    const radiansPerPx = 0.01
    const zoomPerWheelPx = 0.002
    // Deltas come from client coordinates since iOS Safari leaves movementX undefined for touch.
    const pointers = new Map<number, Point>()
    element.style.touchAction = "none"
    element.addEventListener("pointerdown", (event) => {
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
        element.setPointerCapture(event.pointerId)
    })
    element.addEventListener("pointermove", (event) => {
        const last = pointers.get(event.pointerId)
        if (!last) return
        const next = { x: event.clientX, y: event.clientY }
        if (pointers.size === 1) {
            camera.rotate((next.x - last.x) * radiansPerPx, -(next.y - last.y) * radiansPerPx)
        } else if (pointers.size === 2) {
            const other = [...pointers].find(([id]) => id !== event.pointerId)?.[1]
            const lastSpan = other && distance(other, last)
            if (other && lastSpan) camera.zoom(distance(other, next) / lastSpan)
        }
        pointers.set(event.pointerId, next)
    })
    // Fires after both pointerup and pointercancel, so a gesture the browser takes over ends too.
    element.addEventListener("lostpointercapture", (event) => {
        pointers.delete(event.pointerId)
    })
    element.addEventListener("wheel", (event) => {
        event.preventDefault()
        camera.zoom(Math.exp(-wheelPixels(event, element) * zoomPerWheelPx))
    }, { passive: false })
}

function distance(a: Point, b: Point): number {
    return Math.hypot(a.x - b.x, a.y - b.y)
}

// Some browsers report wheels in lines or pages, so every mode is brought to pixels.
function wheelPixels(event: WheelEvent, element: HTMLElement): number {
    const lineHeightPx = 16
    switch (event.deltaMode) {
        case WheelEvent.DOM_DELTA_LINE: return event.deltaY * lineHeightPx
        case WheelEvent.DOM_DELTA_PAGE: return event.deltaY * element.clientHeight
        default: return event.deltaY
    }
}
