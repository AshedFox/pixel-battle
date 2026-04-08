import { CanvasEvent } from '@repo/shared';

const MAGIC = 0x484d4150; // "HMAP"
const HEADER_SIZE = 8; // magic(4) + count(4)
const EVENT_SIZE = 16; // x(2) + y(2) + timestamp(8) + color(4)

export function encodeEvents(events: CanvasEvent[]): Buffer {
  const buffer = Buffer.allocUnsafe(HEADER_SIZE + events.length * EVENT_SIZE);
  let offset = 0;

  buffer.writeUInt32BE(MAGIC, offset);
  offset += 4;
  buffer.writeUInt32BE(events.length, offset);
  offset += 4;

  for (const e of events) {
    buffer.writeUInt16BE(e.x, offset);
    offset += 2;
    buffer.writeUInt16BE(e.y, offset);
    offset += 2;
    buffer.writeDoubleBE(new Date(e.timestamp).getTime(), offset);
    offset += 8;
    buffer.writeUInt32BE(e.color, offset);
    offset += 4;
  }

  return buffer;
}
