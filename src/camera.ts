import type { Point, Point3 } from "./geometry";

export interface Camera {
    project(p: Point3): Point
    rotate(yawDelta: number, pitchDelta: number): void
    setViewport(width: number, height: number): void
    onChange(callback: () => void): void
}

// Orbits the world origin and drops depth, so the origin lands in the middle of the viewport.
export function createCamera(yaw: number, pitch: number): Camera {
    let center: Point = { x: 0, y: 0 }

    function project(p: Point3): Point {
        const x = p.x * Math.cos(yaw) + p.z * Math.sin(yaw)
        const z = -p.x * Math.sin(yaw) + p.z * Math.cos(yaw)
        const y = p.y * Math.cos(pitch) - z * Math.sin(pitch)
        return { x: center.x + x, y: center.y + y }
    }

    function rotate(yawDelta: number, pitchDelta: number): void {
        yaw += yawDelta
        pitch += pitchDelta
        notifyChange()
    }

    function setViewport(width: number, height: number): void {
        center = { x: width / 2, y: height / 2 }
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
    let dragging = false
    element.style.touchAction = "none"
    element.addEventListener("pointerdown", (event) => {
        dragging = true
        element.setPointerCapture(event.pointerId)
    })
    element.addEventListener("pointerup", () => { dragging = false })
    element.addEventListener("pointermove", (event) => {
        if (dragging) camera.rotate(event.movementX * radiansPerPx, -event.movementY * radiansPerPx)
    })
}
