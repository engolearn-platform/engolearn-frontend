class SpeakingPcmWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = [];
    this.position = 0;
    this.step = sampleRate / 16000;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;
    while (this.position < channel.length) {
      const index = Math.floor(this.position);
      const fraction = this.position - index;
      const next = channel[Math.min(index + 1, channel.length - 1)];
      const value = channel[index] * (1 - fraction) + next * fraction;
      this.samples.push(Math.max(-1, Math.min(1, value)));
      this.position += this.step;
      if (this.samples.length === 1600) {
        const pcm = new Int16Array(1600);
        let power = 0;
        for (let i = 0; i < 1600; i++) {
          const sample = this.samples[i];
          power += sample * sample;
          pcm[i] = sample < 0 ? sample * 32768 : sample * 32767;
        }
        this.port.postMessage({ pcm: pcm.buffer, rms: Math.sqrt(power / 1600) }, [pcm.buffer]);
        this.samples = [];
      }
    }
    this.position -= channel.length;
    return true;
  }
}

registerProcessor("speaking-pcm", SpeakingPcmWorklet);
