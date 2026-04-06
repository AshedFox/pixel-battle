import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock2Icon, SearchIcon, XIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { ButtonGroup } from './ui/button-group';
import { Calendar } from './ui/calendar';
import { Field, FieldGroup, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { Slider } from './ui/slider';

const TIMELINE_MS = 24 * 60 * 60 * 1000;
const DEBOUNCE_MS = 300;
const MIN_DATE = new Date('2025-01-01');

function toDatetimeLocal(ts: number): string {
  const date = new Date(ts);
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function toTimeString(date: Date): string {
  return format(date, 'HH:mm');
}

function applyTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

type Props = {
  now: number;
  isLoading: boolean;
  onTimestampChange: (timestamp: number) => void;
};

export const TimeControls = ({ now, isLoading, onTimestampChange }: Props) => {
  const defaultRange: DateRange = {
    from: new Date(now - TIMELINE_MS),
    to: new Date(now),
  };

  const [range, setRange] = useState<DateRange>(defaultRange);
  const [sliderValue, setSliderValue] = useState(range.to!.getTime());
  const [inputValue, setInputValue] = useState(
    toDatetimeLocal(range.to!.getTime()),
  );

  const userMin = range.from?.getTime() ?? now - TIMELINE_MS;
  const userMax = range.to?.getTime() ?? now;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedEmit = useCallback(
    (ts: number) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(
        () => onTimestampChange(ts),
        DEBOUNCE_MS,
      );
    },
    [onTimestampChange],
  );

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const applyRange = useCallback(
    (newRange: DateRange) => {
      const from = newRange.from!;
      const to = new Date(Math.min((newRange.to ?? from).getTime(), now));
      const clamped: DateRange = { from, to };

      setRange(clamped);

      const newSlider = Math.max(
        from.getTime(),
        Math.min(to.getTime(), sliderValue),
      );
      setSliderValue(newSlider);
      setInputValue(toDatetimeLocal(newSlider));
      onTimestampChange(newSlider);
    },
    [now, sliderValue, onTimestampChange],
  );

  const handleSliderChange = useCallback(
    ([ts]: number[]) => {
      setSliderValue(ts);
      setInputValue(toDatetimeLocal(ts));
      debouncedEmit(ts);
    },
    [debouncedEmit],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value),
    [],
  );

  const handleInputSubmit = useCallback(() => {
    const ts = new Date(inputValue).getTime();

    if (isNaN(ts)) {
      return;
    }

    const clamped = Math.min(now, ts);

    setRange((prev) => ({
      from:
        clamped < (prev.from?.getTime() ?? Infinity)
          ? new Date(clamped)
          : prev.from,
      to:
        clamped > (prev.to?.getTime() ?? -Infinity)
          ? new Date(clamped)
          : prev.to,
    }));

    setSliderValue(clamped);
    setInputValue(toDatetimeLocal(clamped));
    onTimestampChange(clamped);
  }, [now, inputValue, onTimestampChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleInputSubmit();
      }
    },
    [handleInputSubmit],
  );

  const handleCalendarSelect = useCallback(
    (selected: DateRange | undefined) => {
      if (!selected?.from) {
        return;
      }

      applyRange({
        from: range.from
          ? applyTime(selected.from, toTimeString(range.from))
          : selected.from,
        to: range.to
          ? applyTime(selected.to ?? selected.from, toTimeString(range.to))
          : selected.to,
      });
    },
    [range, applyRange],
  );

  const handleFromTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!range.from || !range.to) {
        return;
      }

      applyRange({ from: applyTime(range.from, e.target.value), to: range.to });
    },
    [range, applyRange],
  );

  const handleToTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!range.from || !range.to) {
        return;
      }

      applyRange({ from: range.from, to: applyTime(range.to, e.target.value) });
    },
    [range, applyRange],
  );

  const rangeLabel = range.from
    ? range.to
      ? `${format(range.from, 'LLL dd, y, HH:mm')} - ${format(range.to, 'LLL dd, y, HH:mm')}`
      : format(range.from, 'LLL dd, y, HH:mm')
    : 'Pick a timeline range';

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          History Range
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {new Date(sliderValue).toLocaleString()}
        </span>
      </div>

      <ButtonGroup className="w-full">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'flex-1 justify-start text-left font-normal',
                !range.from && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="text-muted-foreground" />
              <span>{rangeLabel}</span>
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleCalendarSelect}
              disabled={(date) => date > new Date() || date < MIN_DATE}
              numberOfMonths={2}
              autoFocus
            />

            <Separator />

            <FieldGroup className="p-3 pt-0 gap-2 flex-row">
              <Field>
                <FieldLabel htmlFor="time-from">Start Time</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="time-from"
                    type="time"
                    value={range.from ? toTimeString(range.from) : '00:00'}
                    onChange={handleFromTimeChange}
                    disabled={!range.from}
                    className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                  <InputGroupAddon>
                    <Clock2Icon className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor="time-to">End Time</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="time-to"
                    type="time"
                    value={range.to ? toTimeString(range.to) : '23:59'}
                    onChange={handleToTimeChange}
                    disabled={!range.to}
                    className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                  <InputGroupAddon>
                    <Clock2Icon className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </FieldGroup>
          </PopoverContent>
        </Popover>

        <Button
          size="icon"
          variant="outline"
          onClick={() => applyRange(defaultRange)}
        >
          <XIcon />
        </Button>
      </ButtonGroup>

      <Slider
        min={userMin}
        max={userMax}
        step={60_000}
        value={[sliderValue]}
        onValueChange={handleSliderChange}
        disabled={isLoading}
      />

      <ButtonGroup className="w-full">
        <Input
          type="datetime-local"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button size="icon" onClick={handleInputSubmit} disabled={isLoading}>
          <SearchIcon />
        </Button>
      </ButtonGroup>
    </div>
  );
};
