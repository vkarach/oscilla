import { createLayer, createSurface } from "./canvas";
import { renderTrailSegment } from "./render";
import { trailPeriod, trailTimeStep, type Lissajous } from "./lissajous";
import type { Theme } from "./theme";
import type { Camera } from "./camera";
import { createBloom } from "./bloom";

export interface Trail {
    toggle(): void
    render(timeSeconds: number): void
    restart(): void
    redraw(): void
}

export function createTrail(parent: HTMLElement, lissajous: Lissajous, theme: Theme, camera: Camera): Trail {
    const surface = createSurface(parent)
    const glow = createLayer(surface)
    const bloom = createBloom()
    let enabled = true
    let justEnabled = true
    let complete = false
    let startSec = 0
    let periodSec = trailPeriod(lissajous)
    surface.onResize(redraw)

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
            glow.clearRect(0, 0, surface.width, surface.height)
            const endT = Math.min(timeSeconds, startSec + periodSec)
            const dt = trailTimeStep(lissajous, 1.5, camera.pixelsPerUnit())
            renderTrailSegment(surface.ctx, glow, lissajous, theme.trail, startSec, endT, dt, camera)
            bloom.apply(glow.canvas, surface.ctx, theme.trail.glowBlur / 2 * surface.ctx.canvas.width / surface.width)
            complete = endT < timeSeconds
        }
    }

    function restart(): void {
        justEnabled = true
        periodSec = trailPeriod(lissajous)
    }

    // Keeps the traced span and only paints it again, for when the view changes.
    function redraw(): void {
        complete = false
    }

    return { toggle, render, restart, redraw }
}

