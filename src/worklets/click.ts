import type { ClickOptions } from "./clickOptions"

class ClickProcessor extends AudioWorkletProcessor {
    private simSeconds = 0
    private lastCrossing = 0
    
    private timeScale = 0 
    private frequencyHz = 2

    private env = 0
    private decay = Math.exp(-1 / (sampleRate * 0.003)) 
    
    constructor(options: { processorOptions: ClickOptions }) {
        super()
        this.frequencyHz = options.processorOptions.frequencyHz
        this.port.onmessage = (event) => { 
            this.timeScale = event.data.timeScale
            this.simSeconds = event.data.simSeconds
            this.lastCrossing = Math.floor(2 * this.frequencyHz * this.simSeconds)
        }
    }

    process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        
        const channel = outputs[0][0]
        for (let i = 0; i < channel.length; i++) {
            this.simSeconds += this.timeScale / sampleRate
            
            const simCrossing = Math.floor(2 * this.frequencyHz * this.simSeconds)
            if (simCrossing !== this.lastCrossing) {
                this.env = 1
            }
            this.lastCrossing = simCrossing
            
            channel[i] = (Math.random() * 2 - 1 ) * this.env
            this.env *= this.decay
        }
        return true
    }
}

registerProcessor("click", ClickProcessor);
