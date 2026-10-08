import type { ClickOptions } from "./clickOptions"

class ClickProcessor extends AudioWorkletProcessor {
    private simSeconds = 0
    private lastCrossing = 0
    
    private timeScale = 0 
    private frequencyHz = 2

    private env = 0
    private decay = Math.exp(-1 / (sampleRate * 0.001)) 
    
    private samplesSinceClick = 0
    private clickHz = 2000

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
                this.samplesSinceClick = 0
                this.env = 1
            }
            this.lastCrossing = simCrossing
            
            channel[i] = this.env * Math.sin(2*Math.PI * this.clickHz * this.samplesSinceClick / sampleRate)
            this.env *= this.decay
            this.samplesSinceClick++
        }
        return true
    }
}

registerProcessor("click", ClickProcessor);
