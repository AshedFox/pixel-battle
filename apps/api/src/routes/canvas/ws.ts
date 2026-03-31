import {
  pixelUpdateSchema,
  WsClientMessage,
  WsServerMessage,
} from '@repo/shared';
import { FastifyPluginAsync } from 'fastify';
import { PubSubService } from '../../shared/pubsub/pubsub.service';
import { PixelUpdateBatchService } from '../../shared/canvas/pixel-update-batch.service';
import { WSBroadcastService } from '../../shared/ws/ws-broadcast.service';

export const canvasWsRoute: FastifyPluginAsync = async (fastify) => {
  const pubSub = new PubSubService(
    fastify.redis,
    fastify.redisSub,
    'canvas:updates',
  );
  const pixelUpdateBatchService = new PixelUpdateBatchService(
    pubSub,
    async (data) => {
      await fastify.canvas.service.setPixels(data);
    },
  );
  const wsBroadcastService = new WSBroadcastService(fastify.websocketServer);

  await pubSub.subscribe(async (message) =>
    wsBroadcastService.broadcast(JSON.stringify(message)),
  );

  fastify.addHook('onClose', async () => {
    await fastify.canvas.batchService.stop();
    await pubSub.unsubscribe();
  });

  fastify.get('/ws', { websocket: true }, (socket, request) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      sendError(socket, 'Missing authentication token');
      socket.close(4001, 'Unauthorized');
      return;
    }

    let userId: string;
    try {
      const decoded = fastify.jwt.verify<{ sub: string }>(token);
      userId = decoded.sub;
    } catch {
      sendError(socket, 'Invalid or expired token');
      socket.close(4001, 'Unauthorized');
      return;
    }

    socket.on('message', async (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as WsClientMessage;

        if (message.type === 'setPixel') {
          const { success, data } = await pixelUpdateSchema.safeParseAsync(
            message.data,
          );

          if (!success) {
            sendError(socket, 'Invalid pixel coordinates or color');
            return;
          }

          const { x, color, y } = data;

          const ok = await fastify.canvas.service.setUserCooldown(userId);

          if (!ok) {
            sendError(socket, 'Cooldown');
            return;
          }

          pixelUpdateBatchService.publish({ x, y, color });

          await fastify.canvas.batchService.add({
            x,
            y,
            color,
            userId,
            timestamp: new Date(),
          });
        }
      } catch (e) {
        console.log(e);
        sendError(socket, 'Something went wrong');
      }
    });
  });
};

function sendError(socket: { send: (data: string) => void }, message: string) {
  const error: WsServerMessage = { type: 'error', data: { message } };
  socket.send(JSON.stringify(error));
}
