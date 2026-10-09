import { context2d, type Surface } from "./canvas";
import type { Point } from "./geometry";

import { pathStart, pathEnd, type Oscillation, computePosition} from "./oscillation"
import { projectionPoint, trailPeriod, trailTimeStep, type Projection } from "./projection";
import type { Scene } from "./scene";
import type { BeamStyle, BodyStyle, DotStyle, GlowStyle, GuideStyle, LineStyle, MarkerStyle, Rgb, Theme } from "./theme";

type PointAt = (timeSeconds: number) => Point

export interface FrameTime {
    simSeconds: number
    timeScale: number
    // Scene time covered since the previous frame.
    frameSimSeconds: number
}

interface Beam {
    pointAt: PointAt
    periodSeconds: number
}

interface BodyView {
    oscillation: Oscillation
    style: BodyStyle
    beam: Beam
    visibility: number
}

interface Layers {
    ctx: CanvasRenderingContext2D
    // Halos go here and share one blur pass, which is far cheaper than blurring every stroke.
    glow: CanvasRenderingContext2D
}

export interface Renderer {
    render(scene: Scene, theme: Theme, frame: FrameTime): void
}

export function createRenderer(surface: Surface): Renderer {
    const glowCanvas = document.createElement("canvas")
    const glow = context2d(glowCanvas)
    function fitGlow(): void {
        glowCanvas.width = surface.ctx.canvas.width
        glowCanvas.height = surface.ctx.canvas.height
        glow.setTransform(surface.ctx.getTransform())
    }
    fitGlow()
    surface.onResize(fitGlow)

    function render(scene: Scene, theme: Theme, frame: FrameTime): void {
        const { ctx } = surface
        ctx.clearRect(0, 0, surface.width, surface.height)
        glow.clearRect(0, 0, surface.width, surface.height)
        renderScene({ ctx, glow }, scene, theme, frame)

        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.globalCompositeOperation = "lighter"
        ctx.filter = `blur(${theme.bloomBlur * ctx.canvas.width / surface.width}px)`
        ctx.drawImage(glowCanvas, 0, 0)
        ctx.restore()
    }

    return { render }
}

function renderScene(layers: Layers, scene: Scene, theme: Theme, frame: FrameTime): void {
    const { ctx } = layers
    const t = frame.simSeconds
    const pPoint = projectionPoint(scene.projection, t)
    const dt = trailTimeStep(scene.projection, 2)

    const views = scene.bodies.map((body): BodyView => {
        const { oscillation } = body
        const style = theme.bodies[oscillation.axis]
        const beam: Beam = { pointAt: (t) => computePosition(oscillation, t), periodSeconds: 1 / oscillation.frequencyHz }
        return { oscillation, style, beam, visibility: spotVisibility(style.ball, beam, frame, dt) }
    })
    // A guide hangs off its body's spot, so it fades together with it.
    for (const view of views) renderGuide(ctx, theme.guide, view.beam.pointAt(t), pPoint, view.visibility)
    for (const view of views) renderBody(layers, view, frame)
    renderMarker(layers, theme.marker, scene.projection, frame, dt)
}

function renderBody(layers: Layers, view: BodyView, frame: FrameTime): void {
    const { ctx } = layers
    const { oscillation, style, beam } = view
    const from = pathStart(oscillation)
    const to = pathEnd(oscillation)
    strokeLine(ctx, style.path, (ctx) => {
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
    })
    renderCenterTick(ctx, style.tick, oscillation)

    renderLineGlow(layers, style.beam, oscillation, frame)
    fillGlowDot(ctx, style.ball, beam.pointAt(frame.simSeconds), view.visibility)
}

// A body retraces one straight line, so its glow is solved exactly per point of the path and drawn as one gradient.
function renderLineGlow(layers: Layers, style: BeamStyle, oscillation: Oscillation, frame: FrameTime): void {
    const { ctx, glow } = layers
    if (frame.timeScale <= 0) return
    const { amplitude, frequencyHz } = oscillation
    const omega = 2 * Math.PI * frequencyHz * frame.timeScale
    const laps = 1 / (1 - Math.exp(-1 / (frequencyHz * frame.timeScale * style.decaySeconds)))
    const phase = 2 * Math.PI * frequencyHz * frame.simSeconds
    const from = pathStart(oscillation)
    const to = pathEnd(oscillation)
    const core = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
    const halo = glow.createLinearGradient(from.x, from.y, to.x, to.y)
    const binPx = 3
    const bins = Math.ceil(2 * amplitude / binPx)

    for (let i = 0; i < bins; i++) {
        const low = Math.asin(-1 + 2 * i / bins)
        const high = Math.asin(-1 + 2 * (i + 1) / bins)
        const rising = (low + high) / 2
        // The beam crosses each point twice per period, once on the way out and once on the way back.
        const ages = [rising, Math.PI - rising].map((crossing) => wrapAngle(phase - crossing) / omega)
        const energy = style.gain * ((high - low) / omega) / (2 * amplitude / bins)
        const brightness = energy * laps * ages.reduce((sum, age) => sum + Math.exp(-age / style.decaySeconds), 0)
        const alpha = 1 - Math.exp(-brightness)
        const offset = (i + 0.5) / bins
        core.addColorStop(offset, rgba(style.color, alpha))
        halo.addColorStop(offset, rgba(style.haloColor, alpha * style.haloAlpha))
    }

    const path = new Path2D()
    path.moveTo(from.x, from.y)
    path.lineTo(to.x, to.y)
    for (const [target, stroke, width] of [[glow, halo, style.haloWidth], [ctx, core, style.width]] as const) {
        target.save()
        target.globalCompositeOperation = "lighter"
        target.lineCap = "round"
        target.strokeStyle = stroke
        target.lineWidth = width
        target.stroke(path)
        target.restore()
    }
}

function wrapAngle(angle: number): number {
    const turn = 2 * Math.PI
    return ((angle % turn) + turn) % turn
}

function rgba(color: Rgb, alpha: number): string {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`
}

function renderMarker(layers: Layers, style: MarkerStyle, projection: Projection, frame: FrameTime, dt: number): void {
    const beam: Beam = { pointAt: (t) => projectionPoint(projection, t), periodSeconds: trailPeriod(projection) }
    renderPhosphor(layers, style.beam, beam, frame, dt)
    fillGlowDot(layers.ctx, style.dot, beam.pointAt(frame.simSeconds), spotVisibility(style.dot, beam, frame, dt))
}

// Glow is the decayed sum of all past passes; for periodic motion every older lap folds into one period.
function renderPhosphor(layers: Layers, style: BeamStyle, beam: Beam, frame: FrameTime, dt: number): void {
    const { ctx, glow } = layers
    const decay = style.decaySeconds * frame.timeScale
    if (decay <= 0) return
    const period = beam.periodSeconds
    // Past eight decay times the glow is below 0.04% and not worth drawing.
    const span = Math.min(period, 8 * decay)
    const laps = 1 / (1 - Math.exp(-period / decay))
    const t = frame.simSeconds
    // Bands sit on the time grid so each piece of the curve fades in place instead of sliding with the head.
    const bandSeconds = 8 * dt

    for (const target of [ctx, glow]) {
        target.save()
        target.globalCompositeOperation = "lighter"
        // Butt caps keep neighboring translucent bands from overlapping into brighter beads.
        target.lineCap = "butt"
        target.lineJoin = "round"
    }
    glow.lineWidth = style.haloWidth
    ctx.lineWidth = style.width
    for (let k = Math.floor((t - span) / bandSeconds); k * bandSeconds < t; k++) {
        const fromT = Math.max(k * bandSeconds, t - span)
        const toT = Math.min((k + 1) * bandSeconds, t)
        const length = pathLength(beam.pointAt, fromT, toT, dt)
        // Real seconds the beam spent per pixel of this band.
        const energy = style.gain * (toT - fromT) / frame.timeScale / Math.max(length, 1e-6)
        const brightness = energy * laps * Math.exp(-(t - (fromT + toT) / 2) / decay)
        // The phosphor saturates smoothly instead of clipping into a flat block.
        const alpha = 1 - Math.exp(-brightness)

        const path = new Path2D()
        tracePolyline(path, beam.pointAt, fromT, toT, dt)
        glow.strokeStyle = rgba(style.haloColor, alpha * style.haloAlpha)
        glow.stroke(path)
        ctx.strokeStyle = rgba(style.color, alpha)
        ctx.stroke(path)
    }
    ctx.restore()
    glow.restore()
}

// Share of the frame the spot lingers over each point it crosses, so it smears out as it speeds up.
function spotVisibility(style: DotStyle, beam: Beam, frame: FrameTime, dt: number): number {
    const t = frame.simSeconds
    const size = 2 * style.glowRadius
    return size / (size + travelDistance(beam, t - frame.frameSimSeconds, t, dt))
}

function travelDistance(beam: Beam, fromT: number, toT: number, dt: number): number {
    const period = beam.periodSeconds
    const laps = Math.floor((toT - fromT) / period)
    const lapLength = laps > 0 ? pathLength(beam.pointAt, 0, period, dt) : 0
    return laps * lapLength + pathLength(beam.pointAt, fromT + laps * period, toT, dt)
}

function pathLength(pointAt: PointAt, fromT: number, toT: number, dt: number): number {
    let length = 0
    let prev = pointAt(fromT)
    for (let k = Math.floor(fromT / dt) + 1; k * dt < toT; k++) {
        const p = pointAt(k * dt)
        length += Math.hypot(p.x - prev.x, p.y - prev.y)
        prev = p
    }
    const end = pointAt(toT)
    return length + Math.hypot(end.x - prev.x, end.y - prev.y)
}

function renderCenterTick(ctx: CanvasRenderingContext2D, style: LineStyle, oscillation: Oscillation): void {
    const tickHalfLength = 10
    const { center, axis } = oscillation
    const dx = axis === "y" ? tickHalfLength : 0
    const dy = axis === "x" ? tickHalfLength : 0

    strokeLine(ctx, style, (ctx) => {
        ctx.moveTo(center.x - dx, center.y - dy)
        ctx.lineTo(center.x + dx, center.y + dy)
    })
}

function renderGuide(ctx: CanvasRenderingContext2D, style: GuideStyle, from: Point, to: Point, alpha: number): void {
    const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
    gradient.addColorStop(0, style.color)
    gradient.addColorStop(1, style.fadeColor)

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.strokeStyle = gradient
    ctx.lineWidth = style.width
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    ctx.restore()
}

export function renderTrailSegment(ctx: CanvasRenderingContext2D, projection: Projection, style: GlowStyle, fromT: number, toT: number, dt: number) {
    strokeGlow(ctx, style, (ctx) => tracePolyline(ctx, (t) => projectionPoint(projection, t), fromT, toT, dt))
}

function tracePolyline(ctx: CanvasPath, pointAt: PointAt, fromT: number, toT: number, dt: number): void {
    const start = pointAt(fromT)
    ctx.moveTo(start.x, start.y)
    // Samples sit on a fixed time grid so a moving window does not make the curve shimmer.
    for (let k = Math.floor(fromT / dt) + 1; k * dt < toT; k++) {
        const p = pointAt(k * dt)
        ctx.lineTo(p.x, p.y)
    }
    const end = pointAt(toT)
    ctx.lineTo(end.x, end.y)
}

function strokeLine(ctx: CanvasRenderingContext2D, style: LineStyle, tracePath: (ctx: CanvasRenderingContext2D) => void): void {
    ctx.save()
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = style.color
    ctx.lineWidth = style.width
    ctx.beginPath()
    tracePath(ctx)
    ctx.stroke()
    ctx.restore()
}

function strokeGlow(ctx: CanvasRenderingContext2D, style: GlowStyle, tracePath: (ctx: CanvasRenderingContext2D) => void): void {
    ctx.save()
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.globalCompositeOperation = "lighter"

    ctx.beginPath()
    tracePath(ctx)

    ctx.save()
    ctx.strokeStyle = style.color
    ctx.lineWidth = style.glowWidth
    ctx.filter = `blur(${style.glowBlur / 2}px)`
    ctx.stroke()
    ctx.restore()

    ctx.strokeStyle = style.coreColor
    ctx.lineWidth = style.width
    ctx.stroke()

    ctx.restore()
}

function fillGlowDot(ctx: CanvasRenderingContext2D, style: DotStyle, point: Point, alpha: number): void {
    const { x, y } = point
    ctx.save()
    ctx.globalCompositeOperation = "lighter"
    ctx.globalAlpha = alpha

    const halo = ctx.createRadialGradient(x, y, 0, x, y, style.glowRadius)
    halo.addColorStop(0, style.color)
    halo.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.arc(x, y, style.glowRadius, 0, 2 * Math.PI)
    ctx.fill()

    ctx.fillStyle = style.coreColor
    ctx.filter = `blur(${style.radius / 3}px)`
    ctx.beginPath()
    ctx.arc(x, y, style.radius, 0, 2 * Math.PI)
    ctx.fill()

    ctx.restore()
}
