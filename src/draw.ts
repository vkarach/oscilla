import type { Circle } from "./circle";
import type { Point } from "./geometry";

import { pathStart, pathEnd, type Oscillation} from "./oscillation"
import { projectionPoint, type Projection } from "./projection";

export function drawCircle(ctx: CanvasRenderingContext2D, circle: Circle, point: Point): void {
    ctx.fillStyle = circle.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, circle.radius, 0, 2 * Math.PI);
    ctx.fill();
}

export function drawPath(ctx: CanvasRenderingContext2D, oscillation: Oscillation): void {
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

export function drawTrailSegment(ctx: CanvasRenderingContext2D, projection: Projection, fromT: number, toT: number, dt: number) {
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
