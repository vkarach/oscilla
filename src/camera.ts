import type { Point, Point3 } from "./geometry";

export interface Camera {
    project(p: Point3): Point
}


export function createCamera(): Camera {
    function project(p: Point3): Point {
        return { x: p.x, y: p.y }
    }
    
    return { project }
}
