import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface TimeSlot {
  label: string;
  value: string;
  available: boolean;
}

interface DeliveryTimeSlotsProps {
  onSelect: (slot: string, estimatedDelivery: Date) => void;
  selectedSlot?: string;
}

export const DeliveryTimeSlots = ({ onSelect, selectedSlot }: DeliveryTimeSlotsProps) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');

  useEffect(() => {
    generateTimeSlots();
  }, [selectedDay]);

  const generateTimeSlots = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const isToday = selectedDay === 'today';

    const baseSlots = [
      { start: 9, end: 12, label: '9AM - 12PM' },
      { start: 12, end: 15, label: '12PM - 3PM' },
      { start: 15, end: 18, label: '3PM - 6PM' },
      { start: 18, end: 21, label: '6PM - 9PM' },
    ];

    const generatedSlots: TimeSlot[] = baseSlots.map(slot => {
      const available = isToday ? currentHour < slot.start - 1 : true;
      return {
        label: slot.label,
        value: `${selectedDay}_${slot.label}`,
        available,
      };
    });

    setSlots(generatedSlots);
  };

  const handleSlotSelect = (value: string) => {
    const slot = slots.find(s => s.value === value);
    if (!slot || !slot.available) return;

    // Calculate estimated delivery date
    const estimatedDelivery = new Date();
    if (selectedDay === 'tomorrow') {
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);
    }
    
    // Set time to the start of the slot
    const [startTime] = slot.label.split(' - ');
    const hour = parseInt(startTime.match(/\d+/)?.[0] || '9');
    const isPM = startTime.includes('PM') && hour !== 12;
    estimatedDelivery.setHours(isPM ? hour + 12 : hour, 0, 0, 0);

    onSelect(slot.label, estimatedDelivery);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-5 h-5 text-primary" />
        <Label className="font-semibold">Select Delivery Time</Label>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSelectedDay('today')}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg border-2 transition-colors font-medium",
            selectedDay === 'today'
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/50"
          )}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setSelectedDay('tomorrow')}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg border-2 transition-colors font-medium",
            selectedDay === 'tomorrow'
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/50"
          )}
        >
          Tomorrow
        </button>
      </div>

      {/* Time Slots */}
      <RadioGroup value={selectedSlot} onValueChange={handleSlotSelect}>
        <div className="grid grid-cols-2 gap-3">
          {slots.map((slot) => (
            <div
              key={slot.value}
              className={cn(
                "relative",
                !slot.available && "opacity-50 cursor-not-allowed"
              )}
            >
              <RadioGroupItem
                value={slot.value}
                id={slot.value}
                disabled={!slot.available}
                className="peer sr-only"
              />
              <Label
                htmlFor={slot.value}
                className={cn(
                  "flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all",
                  "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                  !slot.available && "pointer-events-none"
                )}
              >
                <span className="text-sm font-medium">{slot.label}</span>
              </Label>
              {!slot.available && (
                <span className="absolute top-1 right-1 text-xs text-muted-foreground">
                  Full
                </span>
              )}
            </div>
          ))}
        </div>
      </RadioGroup>

      <p className="text-xs text-muted-foreground">
        * Delivery times are approximate and may vary based on order volume
      </p>
    </div>
  );
};