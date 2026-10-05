export function createCanvasContext(parent: HTMLElement): CanvasRenderingContext2D {
    const canvas = document.createElement("canvas")
    parent.append(canvas);

    const ctx  = canvas.getContext("2d");
    if (!(ctx instanceof CanvasRenderingContext2D)) {
        throw new Error("Can't get canvas.getContext(\"2d\")")
    }
    return ctx;
}
