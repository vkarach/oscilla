import "./style.css";

function getRootElement(): HTMLDivElement {
  const element = document.querySelector<HTMLDivElement>("#app");
  if (!element) {
    throw new Error("Root element #app not found");
  }
  return element;
}

const app = getRootElement();

function frame(timeMs: number): void {
  app.textContent = `Oscilla: ${(timeMs / 1000).toFixed(1)} s`;
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
