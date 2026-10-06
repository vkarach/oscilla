export interface ControlHandlers {
    onToggleTrail: () => void;
}

export function createControls(parent: HTMLElement, handlers: ControlHandlers) {
    const controls = document.createElement("div");
    controls.className = "controls";
    parent.append(controls);

    const button = document.createElement("button");
    button.textContent = "trail";
    button.addEventListener("click", handlers.onToggleTrail);
    controls.append(button);
}
