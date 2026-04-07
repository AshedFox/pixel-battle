import {
  pixelUpdateSchema,
  WsClientMessage,
  WsServerMessage,
} from '@repo/shared';
import { FastifyPluginAsync } from 'fastify';
import { PubSubService } from '../../shared/pubsub/pubsub.service';
import { PixelUpdateBatchService } from '../../shared/canvas/pixel-update-batch.service';
import { WSBroadcastService } from '../../shared/ws/ws-broadcast.service';
import { CanvasOnlineService } from '../../shared/canvas/canvas-online.service';
import { randomUUID } from 'crypto';
import { CanvasSeqService } from '../../shared/canvas/canvas-seq.service';
import { UserJwtPayload } from '../../shared/auth/types';

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
  const onlineService = new CanvasOnlineService(fastify.redis, pubSub);
  const canvasSeqService = new CanvasSeqService(fastify.redis);

  await pubSub.subscribe(async (message) => {
    const seq = await canvasSeqService.increment();

    await wsBroadcastService.broadcast(JSON.stringify({ ...message, seq }));
  });

  onlineService.startBroadcast();

  fastify.addHook('onClose', async () => {
    await pubSub.unsubscribe();
    await pixelUpdateBatchService.stop();
    onlineService.stopBroadcast();
  });

  fastify.get('/ws', { websocket: true }, async (socket, request) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      sendError(socket, 'Missing authentication token');
      socket.close(4001, 'Unauthorized');
      return;
    }

    let userId: string;
    try {
      const decoded = fastify.jwt.verify<UserJwtPayload>(token);
      if (decoded.status !== 'CONFIRMED') {
        sendError(socket, 'Invalid or expired token');
        socket.close(4001, 'Unauthorized');
        return;
      }
      userId = decoded.sub;
    } catch {
      sendError(socket, 'Invalid or expired token');
      socket.close(4001, 'Unauthorized');
      return;
    }

    const connectionId = `${userId}:${randomUUID()}`;

    void onlineService.connect(connectionId).catch((err) => {
      fastify.log.error(
        { err, connectionId },
        'Failed to register websocket connection in online service',
      );
    });

    socket.on('close', () => {
      void onlineService.disconnect(connectionId).catch((err) => {
        fastify.log.error(
          { err, connectionId },
          'Failed to unregister websocket connection in online service',
        );
      });
    });

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

          const { availableAt, ok } =
            await fastify.canvas.service.setUserCooldown(userId);

          if (!ok) {
            sendCooldown(socket, availableAt);
            sendError(socket, 'Cooldown');
            return;
          }

          sendCooldown(socket, availableAt);

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

function sendCooldown(
  socket: { send: (data: string) => void },
  availableAt: Date,
) {
  const message: WsServerMessage = {
    type: 'cooldownUpdate',
    data: { availableAt: availableAt.toISOString() },
  };
  socket.send(JSON.stringify(message));
}
