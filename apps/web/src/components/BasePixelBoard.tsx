import { CanvasHandlers, usePixelBoard } from '@/hooks/usePixelBoard';
import { cn } from '@/lib/utils';
import { MoreVerticalIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { ColorPicker } from './ColorPicker';
import { CoordsBadge } from './CoordsBadge';
import { PixelInfoPopover } from './PixelInfoPopover';
import { ButtonGroup } from './ui/button-group';
import { DrawerTrigger, DrawerContent, Drawer } from './ui/drawer';
import { Field } from './ui/field';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

type Props = {
  base: ReturnType<typeof usePixelBoard>;
  canvasHandlers?: Partial<CanvasHandlers>;
  controlsSlot?: ReactNode;
  badgesSlot?: ReactNode;
  overlaysSlot?: ReactNode;
};

export const BasePixelBoard = ({
  base,
  canvasHandlers,
  badgesSlot,
  controlsSlot,
  overlaysSlot,
}: Props) => {
  const handlers = { ...base.canvasHandlers, ...canvasHandlers };
  const { canvasRef, containerRef } = base.refs;
  const {
    handleConfirm,
    handlePixelPopoverClose,
    setSelectedColor,
    setPendingPixel,
    getPlaceText,
    getPixelColor,
    isOnCooldown,
    isDesktop,
    selectedColor,
    pendingPixel,
    isSameColor,
    isPending,
    popupPos,
    pixelInfo,
    isPixelInfoPending,
    onlineCount,
    coordsStore,
  } = base;

  return (
    <div ref={containerRef} className="absolute inset-0 @container">
      <canvas
        ref={canvasRef}
        {...handlers}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          'block touch-none absolute',
          isOnCooldown ? 'cursor-not-allowed' : 'cursor-crosshair',
        )}
        style={{ imageRendering: 'pixelated' }}
      />

      {overlaysSlot}

      <div className="absolute bottom-0 md:bottom-8 md:left-8 flex flex-col gap-2 items-center w-full md:w-fit">
        {controlsSlot}
        {isDesktop ? (
          <>
            <ColorPicker selected={selectedColor} onChange={setSelectedColor} />
            <Field>
              <Button
                disabled={
                  isOnCooldown || !pendingPixel || isSameColor || isPending
                }
                size="lg"
                onClick={handleConfirm}
              >
                {getPlaceText()}
              </Button>
            </Field>
          </>
        ) : (
          <ButtonGroup className="w-full">
            <Button
              className="flex-1"
              disabled={
                isOnCooldown || !pendingPixel || isSameColor || isPending
              }
              size="lg"
              onClick={handleConfirm}
            >
              {getPlaceText()}
            </Button>
            <Drawer>
              <DrawerTrigger asChild>
                <Button size="icon-lg" variant="outline">
                  <MoreVerticalIcon />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="gap-6">
                <ColorPicker
                  selected={selectedColor}
                  onChange={setSelectedColor}
                />
              </DrawerContent>
            </Drawer>
          </ButtonGroup>
        )}
      </div>

      <PixelInfoPopover
        pixel={pendingPixel}
        pos={popupPos}
        pixelInfo={pixelInfo}
        isLoading={isPixelInfoPending}
        getPixelColor={getPixelColor}
        onClose={handlePixelPopoverClose}
        onPixelClear={() => setPendingPixel(null)}
      />

      <div className="absolute top-2 left-2">
        <Badge
          className="h-8 px-4 border-green-200 text-green-700 bg-green-100 font-semibold"
          variant="secondary"
        >
          <div className="rounded-full bg-green-500 size-2" /> {onlineCount}{' '}
          online
        </Badge>
        {badgesSlot}
      </div>
      <div className="absolute top-2 left-[50%] -translate-x-[50%]">
        <CoordsBadge coordsStore={coordsStore} />
      </div>
    </div>
  );
};
