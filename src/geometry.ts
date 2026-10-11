export interface Point {
    x: number;
    y: number;
}

export interface Point3 {
    x: number;
    y: number;
    z: number;
}

export type Axis = keyof Point3;
