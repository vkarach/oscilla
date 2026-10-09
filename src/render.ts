import type { Surface } from "./canvas";
import type { Point } from "./geometry";

import { pathStart, pathEnd, type Oscillation, computePosition} from "./oscillation"
import { projectionPoint, trailPeriod, trailTimeStep, type Projection } from "./projection";
import type { Scene } from "./scene";
import type { BodyStyle, DotStyle, GlowStyle, GuideStyle, LineStyle, MarkerStyle, Theme } from "./theme";

type PointAt = (timeSeconds: number) => Point

export function renderScene(surface: Surface, scene: Scene, theme: Theme, timeSeconds: number, timeScale: number): void {
    surface.ctx.clearRect(0, 0, surface.width, surface.height)
    const pPoint = projectionPoint(scene.projection, timeSeconds)
    const dt = trailTimeStep(scene.projection, 2)
    renderGuide(surface.ctx, theme.guide, computePosition(scene.projection.horizontal, timeSeconds), pPoint)
    renderGuide(surface.ctx, theme.guide, computePosition(scene.projection.vertical, timeSeconds), pPoint)
    for (const body of scene.bodies) {
        renderBody(surface.ctx, theme.bodies[body.oscillation.axis], body.oscillation, timeSeconds, timeScale, dt)
    }
    renderMarker(surface.ctx, theme.marker, scene.projection, timeSeconds, timeScale, dt)
}

function renderBody(ctx: CanvasRenderingContext2D, style: BodyStyle, oscillation: Oscillation, timeSeconds: number, timeScale: number, dt: number): void {
    const from = pathStart(oscillation)
    const to = pathEnd(oscillation)
    strokeLine(ctx, style.path, (ctx) => {
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
    })
    renderCenterTick(ctx, style.tick, oscillation)

    // Half a period already sweeps the whole path.
    const tailSeconds = Math.min(style.tailSeconds * timeScale, 0.5 / oscillation.frequencyHz)
    const pointAt: PointAt = (t) => computePosition(oscillation, t)
    strokeLine(ctx, style.tail, (ctx) => tracePolyline(ctx, pointAt, timeSeconds - tailSeconds, timeSeconds, dt))

    fillGlowDot(ctx, style.ball, pointAt(timeSeconds))
}

function renderMarker(ctx: CanvasRenderingContext2D, style: MarkerStyle, projection: Projection, timeSeconds: number, timeScale: number, dt: number): void {
    const tailSeconds = Math.min(style.tailSeconds * timeScale, trailPeriod(projection))
    const pointAt: PointAt = (t) => projectionPoint(projection, t)
    const bands = 32

    ctx.save()
    ctx.strokeStyle = style.tail.color
    ctx.lineWidth = style.tail.width
    // Butt caps keep neighboring translucent bands from overlapping into brighter beads.
    ctx.lineCap = "butt"
    ctx.lineJoin = "round"
    for (let k = 0; k < bands; k++) {
        const fromT = timeSeconds - tailSeconds * (1 - k / bands)
        const toT = timeSeconds - tailSeconds * (1 - (k + 1) / bands)
        ctx.globalAlpha = ((k + 1) / bands) ** 2
        ctx.beginPath()
        tracePolyline(ctx, pointAt, fromT, toT, dt)
        ctx.stroke()
    }
    ctx.restore()

    fillGlowDot(ctx, style.dot, pointAt(timeSeconds))
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

function renderGuide(ctx: CanvasRenderingContext2D, style: GuideStyle, from: Point, to: Point): void {
    const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
    gradient.addColorStop(0, style.color)
    gradient.addColorStop(1, style.fadeColor)

    ctx.save()
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

function tracePolyline(ctx: CanvasRenderingContext2D, pointAt: PointAt, fromT: number, toT: number, dt: number): void {
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

function fillGlowDot(ctx: CanvasRenderingContext2D, style: DotStyle, point: Point): void {
    const { x, y } = point
    ctx.save()
    ctx.globalCompositeOperation = "lighter"

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
