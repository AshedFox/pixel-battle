import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover';
import { CANVAS_COLORS, PixelInfoResponse } from '@repo/shared';
import { Pixel } from '@/types/pixel';
import { Button } from './ui/button';
import { XIcon } from 'lucide-react';
import { Spinner } from './ui/spinner';

type Props = {
  pixel: Pixel | null;
  pos: { x: number; y: number } | null;
  pixelInfo: PixelInfoResponse | null;
  isLoading: boolean;
  getPixelColor: (x: number, y: number) => number;
  onClose: () => void;
  onPixelClear: () => void;
};

export const PixelInfoPopover = ({
  pixel,
  pos,
  pixelInfo,
  isLoading,
  getPixelColor,
  onClose,
  onPixelClear,
}: Props) => {
  if (!pixel || !pos) {
    return null;
  }

  const color = CANVAS_COLORS[getPixelColor(pixel.x, pixel.y)];

  return (
    <>
      <Popover open onOpenChange={(open) => !open && onClose()}>
        <PopoverAnchor asChild>
          <div
            className="absolute w-1 h-1 pointer-events-none"
            style={{ left: pos.x, top: pos.y }}
          />
        </PopoverAnchor>
        <PopoverContent
          className="w-52"
          align="start"
          side="right"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div
                style={{ backgroundColor: color }}
                className="size-8 border shrink-0 rounded-sm"
              />
              <div>
                ({pixel.x}, {pixel.y})
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  onClose();
                  onPixelClear();
                }}
              >
                <XIcon />
              </Button>
            </div>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">
                <Spinner /> Loading...
              </div>
            ) : pixelInfo ? (
              <div className="flex flex-col gap-1">
                {!pixelInfo.userName && !pixelInfo.timestamp ? (
                  <div className="text-sm font-medium">{'Starting pixel'}</div>
                ) : (
                  <>
                    <div className="text-sm font-medium truncate">
                      {pixelInfo.userName ?? 'Unknown user'}
                    </div>
                    {pixelInfo.timestamp && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(pixelInfo.timestamp).toLocaleString()}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No info</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};
