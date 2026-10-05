export function createCanvasContext(parent: HTMLElement): CanvasRenderingContext2D {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 920;
    parent.append(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Can't get canvas.getContext(\"2d\")");
    }
    return ctx;
}
