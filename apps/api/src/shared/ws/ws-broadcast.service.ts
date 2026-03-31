import { WebSocketServer } from 'ws';

const DEFAULT_CHUNK = 100;

export class WSBroadcastService {
  constructor(
    private readonly wss: WebSocketServer,
    private readonly chunk = DEFAULT_CHUNK,
  ) {}

  async broadcast(payload: string): Promise<void> {
    const clients = [...this.wss.clients];
    for (let i = 0; i < clients.length; i += this.chunk) {
      for (const client of clients.slice(i, i + this.chunk)) {
        if (client.readyState === client.OPEN) {
          client.send(payload);
        }
      }
      if (i + this.chunk < clients.length) {
        await new Promise((r) => setImmediate(r));
      }
    }
  }
}
