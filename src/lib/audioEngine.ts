class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private source = "";

  private getAudio(source: string) {
    if (!this.audio || this.source !== source) {
      this.audio = new Audio(source);
      this.audio.preload = "auto";
      this.source = source;
    }

    return this.audio;
  }

  async unlock(source: string) {
    const audio = this.getAudio(source);

    audio.muted = true;
    audio.currentTime = 0;

    await audio.play();
    audio.pause();

    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = 1;
  }

  async play(source: string) {
    const audio = this.getAudio(source);

    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = 1;

    await audio.play();

    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
      };

      const handleEnded = () => {
        cleanup();
        resolve();
      };

      const handleError = () => {
        cleanup();
        reject(new Error("Ezan ses dosyası oynatılamadı."));
      };

      audio.addEventListener("ended", handleEnded, { once: true });
      audio.addEventListener("error", handleError, { once: true });
    });
  }

  stop() {
    if (!this.audio) return;

    this.audio.pause();
    this.audio.currentTime = 0;
  }
}

export const audioEngine = new AudioEngine();
