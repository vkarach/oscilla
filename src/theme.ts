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

export type Rgb = readonly [number, number, number]

export interface BeamStyle {
    color: Rgb
    width: number
    haloColor: Rgb
    haloAlpha: number
    haloWidth: number
    // Real seconds for the phosphor glow to fade to 1/e.
    decaySeconds: number
    // Real beam speed in px/s at which a single pass reaches unit brightness before saturation.
    gain: number
}

export interface BodyStyle {
    path: LineStyle
    tick: LineStyle
    ball: DotStyle
    beam: BeamStyle
}

export interface MarkerStyle {
    dot: DotStyle
    beam: BeamStyle
}

export interface Theme {
    background: string
    // Blur radius in px of the shared halo layer.
    bloomBlur: number
    guide: GuideStyle
    trail: GlowStyle
    bodies: Record<Oscillation["axis"], BodyStyle>
    marker: MarkerStyle
}

export function createTheme(): Theme {
    return {
        background: "#0d0d10",
        bloomBlur: 4,
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
                beam: { color: [255, 200, 205], width: 2.5, haloColor: [255, 120, 130], haloAlpha: 0.35, haloWidth: 9, decaySeconds: 0.1, gain: 4000 },
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
                beam: { color: [255, 205, 100], width: 2.5, haloColor: [255, 150, 30], haloAlpha: 0.35, haloWidth: 9, decaySeconds: 0.1, gain: 4000 },
            },
        },
        marker: {
            dot: {
                coreColor: "rgb(255, 245, 235)",
                color: "rgba(255, 140, 90, 0.8)",
                radius: 6,
                glowRadius: 24,
            },
            beam: { color: [255, 215, 185], width: 2.5, haloColor: [255, 140, 90], haloAlpha: 0.5, haloWidth: 8, decaySeconds: 0.3, gain: 10000 },
        },
    }
}
