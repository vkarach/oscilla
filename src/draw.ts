import type { Circle } from "./circle";
import type { Point } from "./geometry";

export function drawCircle(ctx: CanvasRenderingContext2D, circle: Circle, point: Point): void {
    ctx.fillStyle = circle.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, circle.radius, 0, 2 * Math.PI);
    ctx.fill();
}
