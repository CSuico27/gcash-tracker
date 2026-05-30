import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";

interface DatePickerProps {
  value: string;
  onChange: (iso: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  withTime?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  label,
  required,
  disabled,
  placeholder = "Select date",
  withTime = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [time, setTime] = useState(() => {
    if (value) return value.slice(11, 16) || "00:00";
    return "00:00";
  });
  const ref = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value.slice(0, 10) + "T00:00:00") : undefined;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        portalRef.current && !portalRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleScroll = (e: Event) => {
      if (portalRef.current && portalRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  const handleOpen = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
    setOpen((o) => !o);
  };

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, "0");
    const dd = String(day.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if (withTime) {
      onChange(`${dateStr}T${time}`);
    } else {
      onChange(dateStr);
      setOpen(false);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (value) {
      const dateStr = value.slice(0, 10);
      onChange(`${dateStr}T${newTime}`);
    }
  };

  const displayValue = () => {
    if (!value) return "";
    const [datePart, timePart] = value.split("T");
    const [yyyy, mm, dd] = datePart.split("-").map(Number);
    const [hh, min] = (timePart ?? "00:00").split(":").map(Number);
    const date = new Date(yyyy, mm - 1, dd, hh, min);

    if (withTime) {
      return date.toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const inputClass =
    "w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 disabled:opacity-60 disabled:cursor-not-allowed text-left";

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="block mb-1 text-sm text-gray-700 dark:text-gray-400">
          {label} {required && <span className="text-error-500">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={inputClass}
      >
        {displayValue() || <span className="text-gray-400">{placeholder}</span>}
      </button>

      {open && createPortal(
        <div
          ref={portalRef}
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[999999] rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-100 dark:bg-gray-200 p-2 w-fit"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleDaySelect}
            captionLayout="dropdown"
            startMonth={new Date(2020, 0)}
            endMonth={new Date(2030, 11)}
            timeZone="Asia/Manila"
            showOutsideDays={false}
            styles={{
              root: { fontFamily: "inherit", fontSize: "0.75rem" },
            }}
            classNames={{
              today: "font-bold text-brand-500",
              selected: "bg-brand-500 !text-white rounded-md",
              day: "rounded-md hover:bg-gray-100 dark:hover:bg-gray-800",
            }}
          />

          {withTime && (
            <div className="px-2 pb-2 border-t border-gray-100 dark:border-gray-700 pt-2 text-sm">
              <label className="block mb-1 text-xs text-gray-500">Time</label>
              <input
                type="time"
                value={time}
                onChange={handleTimeChange}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 w-full py-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg"
              >
                Done
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}