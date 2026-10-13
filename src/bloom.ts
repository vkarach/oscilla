import { context2d } from "./canvas"

export interface Bloom {
    // Blurs source by about blurPx, both in device pixels, and adds it onto target.
    apply(source: HTMLCanvasElement, target: CanvasRenderingContext2D, blurPx: number): void
}

// Halving a layer a few times and stretching it back blurs it for a few drawImage calls; ctx.filter blur is many times slower in Firefox.
export function createBloom(): Bloom {
    const levels: CanvasRenderingContext2D[] = []

    function level(index: number, width: number, height: number): CanvasRenderingContext2D {
        levels[index] ??= context2d(document.createElement("canvas"))
        const { canvas } = levels[index]
        // Assigning a size reallocates the canvas even when unchanged.
        if (canvas.width !== width) canvas.width = width
        if (canvas.height !== height) canvas.height = height
        return levels[index]
    }

    function apply(source: HTMLCanvasElement, target: CanvasRenderingContext2D, blurPx: number): void {
        // Down and back up from 2^n spreads a point to a deviation of about 0.6 * 2^n.
        const wantedSteps = Math.round(Math.log2(blurPx / 0.6)) || 1
        // Capped where the source shrinks to a pixel, which also bounds a blur of an unsized surface.
        const maxSteps = Math.ceil(Math.log2(Math.max(source.width, source.height, 2)))
        const steps = Math.min(maxSteps, Math.max(1, wantedSteps))
        const chain: CanvasRenderingContext2D[] = []
        let from = source
        for (let i = 0; i < steps; i++) {
            const ctx = level(i, Math.max(1, Math.ceil(from.width / 2)), Math.max(1, Math.ceil(from.height / 2)))
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
            ctx.drawImage(from, 0, 0, ctx.canvas.width, ctx.canvas.height)
            chain.push(ctx)
            from = ctx.canvas
        }
        // Stretching back one octave at a time smooths the blocks a single big stretch would leave.
        for (let i = chain.length - 2; i >= 0; i--) {
            const ctx = chain[i]
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
            ctx.drawImage(chain[i + 1].canvas, 0, 0, ctx.canvas.width, ctx.canvas.height)
        }

        target.save()
        target.setTransform(1, 0, 0, 1, 0, 0)
        target.globalCompositeOperation = "lighter"
        target.drawImage(chain[0].canvas, 0, 0, target.canvas.width, target.canvas.height)
        target.restore()
    }

    return { apply }
}
