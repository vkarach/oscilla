import type { Circle } from "./circle";
import type { Point } from "./geometry";

import { pathStart, pathEnd, type Oscillation} from "./oscillation"

export function drawCircle(ctx: CanvasRenderingContext2D, circle: Circle, point: Point): void {
    ctx.fillStyle = circle.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, circle.radius, 0, 2 * Math.PI);
    ctx.fill();
}

export function drawPath(ctx: CanvasRenderingContext2D, oscillation: Oscillation): void {
    ctx.strokeStyle = "#c74d4d"
    ctx.lineWidth = 6;
    ctx.beginPath();
    
    const s = pathStart(oscillation)
    const e = pathEnd(oscillation)
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(e.x, e.y)
    
    ctx.stroke();
}
