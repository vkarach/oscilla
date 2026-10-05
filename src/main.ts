import "./style.css";
import { createCanvasContext } from "./canvas"
import { draw } from "./draw";

function getRootElement(): HTMLDivElement {
  const element = document.querySelector<HTMLDivElement>("#app");
  if (!element) {
    throw new Error("Root element #app not found");
  }
  return element;
}

const app = getRootElement();
const ctx = createCanvasContext(app)

draw(ctx);
