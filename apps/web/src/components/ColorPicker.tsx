import { CANVAS_COLORS } from '@repo/shared';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';

type Props = {
  className?: string;
  selected: number;
  onChange: (i: number) => void;
};

export const ColorPicker = ({ className, selected, onChange }: Props) => {
  return (
    <Card className={cn('w-full max-w-sm', className)}>
      <CardContent>
        <div className="grid grid-cols-6 2xl:grid-cols-8 gap-2">
          {CANVAS_COLORS.map((c, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={cn(
                'size-8 rounded-sm transition-transform border',
                selected === i
                  ? 'scale-80 cursor-not-allowed'
                  : 'hover:scale-95 cursor-pointer',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
