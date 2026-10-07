import { createSurface } from "./canvas";
import { renderTrailSegment } from "./render";
import { trailPeriod, trailTimeStep, type Projection } from "./projection";

export interface Trail {
    toggle(): void
    render(timeSeconds: number): void
}

export function createTrail(parent: HTMLElement, projection: Projection): Trail {
    const surface = createSurface(parent)
    let enabled = true
    let justEnabled = true
    let complete = false
    let startSec = 0
    let periodSec = trailPeriod(projection)
    let renderDt = trailTimeStep(projection, 1.5)
    
    function toggle(): void {
        enabled = !enabled
        justEnabled = true
        surface.ctx.canvas.hidden = !enabled
    }
    
    function render(timeSeconds: number): void {
        if (justEnabled) {
            startSec = timeSeconds
            complete = false
            justEnabled = false
        }
        if (enabled && !complete) {
            surface.ctx.clearRect(0, 0, surface.width, surface.height)
            const endT = Math.min(timeSeconds, startSec + periodSec)
            renderTrailSegment(surface.ctx, projection, startSec, endT, renderDt)
            complete = endT < timeSeconds
        }
    }

    return { toggle, render }
}

