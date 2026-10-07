export interface Surface {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    onResize(callback: () => void): void;
}

export function createSurface(parent: HTMLElement): Surface {
    const canvas = document.createElement("canvas");
    parent.append(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Can't get canvas.getContext(\"2d\")");
    }
    const resizeListeners: (() => void)[] = [];
    const surface: Surface = {
        ctx,
        width: 0,
        height: 0,
        onResize(callback) { resizeListeners.push(callback) },
    };
    const handleResize = ([entry]: ResizeObserverEntry[]) => {
        const cssSize = entry.contentBoxSize[0];
        const deviceSize = entry.devicePixelContentBoxSize?.[0];
        canvas.width = deviceSize?.inlineSize ?? Math.round(cssSize.inlineSize * devicePixelRatio);
        canvas.height = deviceSize?.blockSize ?? Math.round(cssSize.blockSize * devicePixelRatio);
        surface.width = cssSize.inlineSize;
        surface.height = cssSize.blockSize;
        ctx.setTransform(canvas.width / surface.width, 0, 0, canvas.height / surface.height, 0, 0);
        for (const listener of resizeListeners) listener();
    };
    // Zoom changes only the CSS size and a DPI change only the device size, so watch both.
    new ResizeObserver(handleResize).observe(canvas, { box: "content-box" });
    try {
        new ResizeObserver(handleResize).observe(canvas, { box: "device-pixel-content-box" });
    } catch {
        // unsupported box: the content-box observer still covers resizes and zoom
    }
    return surface;
}
