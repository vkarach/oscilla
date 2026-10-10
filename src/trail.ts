import { createSurface } from "./canvas";
import { renderTrailSegment } from "./render";
import { trailPeriod, trailTimeStep, type Projection } from "./projection";
import type { Theme } from "./theme";

export interface Trail {
    toggle(): void
    render(timeSeconds: number): void
    restart(): void
}

export function createTrail(parent: HTMLElement, projection: Projection, theme: Theme): Trail {
    const surface = createSurface(parent)
    let enabled = true
    let justEnabled = true
    let complete = false
    let startSec = 0
    let periodSec = trailPeriod(projection)
    let renderDt = trailTimeStep(projection, 1.5)
    surface.onResize(() => { complete = false })

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
            renderTrailSegment(surface.ctx, projection, theme.trail, startSec, endT, renderDt)
            complete = endT < timeSeconds
        }
    }

    function restart(): void {
        justEnabled = true
        periodSec = trailPeriod(projection)
        renderDt = trailTimeStep(projection, 1.5)
    }

    return { toggle, render, restart }
}

