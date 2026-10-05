import type { Circle } from "./circle";
import type { Oscillation } from "./oscillation";

export interface Body {
    oscillation: Oscillation;
    circle: Circle;
}
