import {
  drawRectSchema,
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
import { NewDrawEvent } from '../../db/schema/draw-events';

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
    let decoded: UserJwtPayload;
    try {
      decoded = fastify.jwt.verify<UserJwtPayload>(token);
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
        } else if (message.type === 'drawRect') {
          if (decoded.role !== 'ADMIN') {
            sendError(socket, 'Forbidden');
            return;
          }

          const { success, data } = await drawRectSchema.safeParseAsync(
            message.data,
          );

          if (!success) {
            sendError(socket, 'Invalid rectangle coordinates or color');
            return;
          }

          const { x, y, width, height, color } = data;

          await pixelUpdateBatchService.flush();
          fastify.canvas.service.setRect(data);
          pubSub.publish({ type: 'rectDrawn', data });

          const events: NewDrawEvent[] = [];
          const timestamp = new Date();

          for (let dx = 0; dx < width; dx++) {
            for (let dy = 0; dy < height; dy++) {
              events.push({
                x: x + dx,
                y: y + dy,
                color,
                userId: null,
                timestamp,
              });
            }
          }

          await fastify.canvas.batchService.addBulk(events);
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
