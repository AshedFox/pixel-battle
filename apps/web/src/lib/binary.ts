import { CanvasEvent } from '@repo/shared';

const MAGIC = 0x484d4150; // "HMAP"
const HEADER_SIZE = 8; // magic(4) + count(4)
const EVENT_SIZE = 16; // x(2) + y(2) + timestamp(8) + color(4)

export function decodeEvents(buffer: ArrayBuffer): CanvasEvent[] {
  const view = new DataView(buffer);

  const magic = view.getUint32(0, false);

  if (magic !== MAGIC) {
    throw new Error('Invalid binary format');
  }

  const count = view.getUint32(4, false);
  const events: CanvasEvent[] = new Array(count);
  let offset = HEADER_SIZE;

  for (let i = 0; i < count; i++) {
    events[i] = {
      x: view.getUint16(offset, false),
      y: view.getUint16(offset + 2, false),
      timestamp: view.getFloat64(offset + 4, false),
      color: view.getUint32(offset + 12, false),
    };
    offset += EVENT_SIZE;
  }

  return events;
}
