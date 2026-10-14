// Browser-only: the end-of-session chime and notification

let audio: AudioContext | null = null;

// Call from the Start click. Browsers only allow sound and the permission prompt after a gesture
export function prepareAlerts() {
  try {
    audio ??= new AudioContext();
    void audio.resume();
  } catch {
    // No Web Audio; the session still ends silently
  }
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

// Three soft sine notes
function playChime() {
  if (!audio) return;
  const start = audio.currentTime;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = audio!.createOscillator();
    const gain = audio!.createGain();
    const at = start + index * 0.45;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.25, at + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 1.2);
    oscillator.connect(gain).connect(audio!.destination);
    oscillator.start(at);
    oscillator.stop(at + 1.2);
  });
}

export function alertFinished(minutes: number) {
  playChime();
  // On screen the chime and the finish card are enough; a notification is for a hidden tab
  if (document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification("Focus session complete", {
      body: `${minutes} minute${minutes === 1 ? "" : "s"} done. Nicely done.`,
    });
  }
}
