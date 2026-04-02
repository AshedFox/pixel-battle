import { WebSocketServer } from 'ws';
import { config } from '../../config';

const BUFFERED_LIMIT = 1_000_000;

export class WSBroadcastService {
  constructor(private readonly wss: WebSocketServer) {}

  async broadcast(payload: string): Promise<void> {
    const chunk = config.WS_BROADCAST_CHUNK;
    const clients = [...this.wss.clients];

    for (let i = 0; i < clients.length; i += chunk) {
      for (const client of clients.slice(i, i + chunk)) {
        if (client.readyState === client.OPEN) {
          if (client.bufferedAmount > BUFFERED_LIMIT) {
            client.close(1013, 'Client too slow reconnect required');
            continue;
          }
          client.send(payload);
        }
      }
      if (i + chunk < clients.length) {
        await new Promise((r) => setImmediate(r));
      }
    }
  }
}
