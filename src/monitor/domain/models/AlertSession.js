export class AlertSession {
  constructor(startTime, initialLevel, protocols) {
    this.startTime = startTime;
    this.peakGasLevel = initialLevel;
    this.protocols = protocols;
  }

  updateLevel(newLevel) {
    if (newLevel > this.peakGasLevel) {
      this.peakGasLevel = newLevel;
    }
  }

  updateProtocols(newProtocols) {
    this.protocols = newProtocols;
  }

  getDuration(endTime) {
    const durationMs = endTime - this.startTime;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    return { minutes, seconds: seconds % 60 };
  }
}
