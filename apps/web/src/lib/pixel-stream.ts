export class PixelStream {
  private listeners = new Set<(x: number, y: number) => void>();

  subscribe(listener: (x: number, y: number) => void) {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  }

  emit(x: number, y: number) {
    this.listeners.forEach((l) => l(x, y));
  }
}
