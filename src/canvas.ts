export interface Surface {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
}

export function createSurface(parent: HTMLElement): Surface {
    const canvas = document.createElement("canvas");
    parent.append(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Can't get canvas.getContext(\"2d\")");
    }
    const surface: Surface = { ctx, width: 0, height: 0 };
    const observer = new ResizeObserver(([entry]) => {
        const cssSize = entry.contentBoxSize[0];
        const deviceSize = entry.devicePixelContentBoxSize?.[0];
        canvas.width = deviceSize?.inlineSize ?? Math.round(cssSize.inlineSize * devicePixelRatio);
        canvas.height = deviceSize?.blockSize ?? Math.round(cssSize.blockSize * devicePixelRatio);
        surface.width = cssSize.inlineSize;
        surface.height = cssSize.blockSize;
        ctx.setTransform(canvas.width / surface.width, 0, 0, canvas.height / surface.height, 0, 0);
    });
    try {
        observer.observe(canvas, { box: "device-pixel-content-box" });
    } catch {
        observer.observe(canvas, { box: "content-box" });
    }
    return surface;
}
