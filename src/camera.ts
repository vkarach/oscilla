import type { Point, Point3 } from "./geometry";

export interface Camera {
    project(p: Point3): Point
    rotate(yawDelta: number, pitchDelta: number): void
    setViewport(width: number, height: number): void
    onChange(callback: () => void): void
}

// Orbits the world origin and drops depth, so the origin lands in the middle of the viewport.
export function createCamera(yaw: number, pitch: number, fitRadius: number): Camera {
    const marginPx = 24
    let center: Point = { x: 0, y: 0 }
    let scale = 1

    function project(p: Point3): Point {
        const x = p.x * Math.cos(yaw) + p.z * Math.sin(yaw)
        const z = -p.x * Math.sin(yaw) + p.z * Math.cos(yaw)
        const y = p.y * Math.cos(pitch) - z * Math.sin(pitch)
        return { x: center.x + scale * x, y: center.y + scale * y }
    }

    function rotate(yawDelta: number, pitchDelta: number): void {
        yaw += yawDelta
        pitch += pitchDelta
        notifyChange()
    }

    function setViewport(width: number, height: number): void {
        center = { x: width / 2, y: height / 2 }
        // Shrinks only when a sphere of fitRadius would leave the viewport, so large screens keep 1 px per unit.
        scale = Math.min(1, Math.max(0, Math.min(width, height) / 2 - marginPx) / fitRadius)
        notifyChange()
    }

    const changeListeners: (() => void)[] = []
    function onChange(callback: () => void): void {
        changeListeners.push(callback)
    }

    function notifyChange(): void {
        for (const callback of changeListeners) callback()
    }

    return { project, rotate, setViewport, onChange }
}

export function dragToRotate(element: HTMLElement, camera: Camera): void {
    const radiansPerPx = 0.01
    // Deltas come from client coordinates since iOS Safari leaves movementX undefined for touch.
    let drag: { pointerId: number, x: number, y: number } | undefined
    element.style.touchAction = "none"
    element.addEventListener("pointerdown", (event) => {
        if (drag) return
        drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
        element.setPointerCapture(event.pointerId)
    })
    element.addEventListener("pointermove", (event) => {
        if (event.pointerId !== drag?.pointerId) return
        camera.rotate((event.clientX - drag.x) * radiansPerPx, -(event.clientY - drag.y) * radiansPerPx)
        drag.x = event.clientX
        drag.y = event.clientY
    })
    // Fires after both pointerup and pointercancel, so a drag the browser takes over ends too.
    element.addEventListener("lostpointercapture", (event) => {
        if (event.pointerId === drag?.pointerId) drag = undefined
    })
}
