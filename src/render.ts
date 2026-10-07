import type { Surface } from "./canvas";
import type { Circle } from "./circle";
import type { Point } from "./geometry";

import { pathStart, pathEnd, type Oscillation, computePosition} from "./oscillation"
import { projectionPoint, type Projection } from "./projection";
import type { Scene } from "./scene";


export function renderScene(surface: Surface, scene: Scene, timeSeconds: number): void {
    surface.ctx.clearRect(0, 0, surface.width, surface.height)
    const pPoint = projectionPoint(scene.projection, timeSeconds)
    renderDashedLine(surface.ctx, computePosition(scene.projection.horizontal, timeSeconds), pPoint)
    renderDashedLine(surface.ctx, computePosition(scene.projection.vertical, timeSeconds), pPoint)
    for (const body of scene.bodies) {
        const pos = computePosition(body.oscillation, timeSeconds);
        renderPath(surface.ctx, body.oscillation)
        renderCenterTick(surface.ctx, body.oscillation)
        renderCircle(surface.ctx, body.circle, pos);
    }
    renderCircle(surface.ctx, scene.projection.marker, pPoint)
}

function renderCircle(ctx: CanvasRenderingContext2D, circle: Circle, point: Point): void {
    ctx.fillStyle = circle.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, circle.radius, 0, 2 * Math.PI);
    ctx.fill();
}

function renderPath(ctx: CanvasRenderingContext2D, oscillation: Oscillation ): void {
    ctx.strokeStyle = "#c74d4d"
    ctx.lineWidth = 6;
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    ctx.beginPath();
    
    const s = pathStart(oscillation)
    const e = pathEnd(oscillation)
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(e.x, e.y)
    ctx.stroke();
}

function renderCenterTick(ctx: CanvasRenderingContext2D, oscillation: Oscillation): void {
    const tickHalfLength = 10
    const { center, axis } = oscillation
    const dx = axis === "y" ? tickHalfLength : 0
    const dy = axis === "x" ? tickHalfLength : 0

    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(center.x - dx, center.y - dy)
    ctx.lineTo(center.x + dx, center.y + dy)
    ctx.stroke()
}

function renderDashedLine(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
    ctx.lineWidth = 2
    ctx.strokeStyle = "#b0a2a2bc"
    
    ctx.save();
    ctx.setLineDash([6, 4]);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y)
    
    ctx.stroke();
    ctx.restore();
}

export function renderTrailSegment(ctx: CanvasRenderingContext2D, projection: Projection, fromT: number, toT: number, dt: number) {
    ctx.strokeStyle = projection.style.color
    ctx.lineWidth = projection.style.lineWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    ctx.beginPath();
    
    const startP = projectionPoint(projection, fromT)
    ctx.moveTo(startP.x, startP.y);
    for (let t = fromT + dt; t < toT; t+=dt) {
        const p = projectionPoint(projection, t)
        ctx.lineTo(p.x, p.y)
    }

    const toP = projectionPoint(projection, toT)
    ctx.lineTo(toP.x, toP.y)

    ctx.stroke();
}
