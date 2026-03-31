import { useSyncExternalStore } from 'react';
import { Badge } from './ui/badge';
import { createCoordsStore } from '@/lib/coords-store';

type Props = {
  coordsStore: ReturnType<typeof createCoordsStore>;
};

export const CoordsBadge = ({ coordsStore }: Props) => {
  const coords = useSyncExternalStore(
    coordsStore.subscribe,
    coordsStore.getSnapshot,
  );

  if (!coords) {
    return (
      <Badge className="h-8 w-24" variant="destructive">
        -, -
      </Badge>
    );
  }

  return (
    <Badge
      className="h-8 w-24 notranslate"
      variant="destructive"
      translate="no"
    >
      {coords.x}, {coords.y}
    </Badge>
  );
};
