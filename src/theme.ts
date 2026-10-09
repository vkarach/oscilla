import type { Oscillation } from "./oscillation"

export interface LineStyle {
    color: string
    width: number
}

export interface GlowStyle {
    color: string
    coreColor: string
    width: number
    glowWidth: number
    glowBlur: number
}

export interface DotStyle {
    color: string
    coreColor: string
    radius: number
    glowRadius: number
}

export interface GuideStyle {
    color: string
    fadeColor: string
    width: number
}

export interface BodyStyle {
    path: LineStyle
    tick: LineStyle
    ball: DotStyle
    tail: LineStyle
    // Real seconds of motion the tail spans, so it grows with speed.
    tailSeconds: number
}

export interface MarkerStyle {
    dot: DotStyle
    tail: LineStyle
    tailSeconds: number
}

export interface Theme {
    background: string
    guide: GuideStyle
    trail: GlowStyle
    bodies: Record<Oscillation["axis"], BodyStyle>
    marker: MarkerStyle
}

export function createTheme(): Theme {
    return {
        background: "#0d0d10",
        guide: {
            color: "rgba(255, 150, 110, 0.45)",
            fadeColor: "rgba(255, 150, 110, 0)",
            width: 1,
        },
        trail: {
            color: "rgba(255, 110, 60, 0.12)",
            coreColor: "rgb(120, 70, 50)",
            width: 1.5,
            glowWidth: 3,
            glowBlur: 4,
        },
        bodies: {
            x: {
                path: { color: "rgba(255, 140, 150, 0.25)", width: 1 },
                tick: { color: "rgba(255, 140, 150, 0.6)", width: 1.5 },
                ball: {
                    coreColor: "rgb(255, 250, 248)",
                    color: "rgba(255, 120, 130, 0.8)",
                    radius: 7,
                    glowRadius: 26,
                },
                tail: { color: "rgb(255, 200, 205)", width: 4 },
                tailSeconds: 0.09,
            },
            y: {
                path: { color: "rgba(255, 160, 60, 0.25)", width: 1 },
                tick: { color: "rgba(255, 160, 60, 0.6)", width: 1.5 },
                ball: {
                    coreColor: "rgb(255, 248, 225)",
                    color: "rgba(255, 150, 30, 0.8)",
                    radius: 7,
                    glowRadius: 26,
                },
                tail: { color: "rgb(255, 205, 100)", width: 4 },
                tailSeconds: 0.09,
            },
        },
        marker: {
            dot: {
                coreColor: "rgb(255, 245, 235)",
                color: "rgba(255, 140, 90, 0.8)",
                radius: 6,
                glowRadius: 24,
            },
            tail: { color: "rgb(255, 190, 150)", width: 2.5 },
            tailSeconds: 0.8,
        },
    }
}
