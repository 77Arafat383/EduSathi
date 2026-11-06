import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface MonthYearPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

const MONTHS = [
  { short: 'Jan', full: 'January' },
  { short: 'Feb', full: 'February' },
  { short: 'Mar', full: 'March' },
  { short: 'Apr', full: 'April' },
  { short: 'May', full: 'May' },
  { short: 'Jun', full: 'June' },
  { short: 'Jul', full: 'July' },
  { short: 'Aug', full: 'August' },
  { short: 'Sep', full: 'September' },
  { short: 'Oct', full: 'October' },
  { short: 'Nov', full: 'November' },
  { short: 'Dec', full: 'December' },
];

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Select Month & Year',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse existing value (e.g. "October 2026")
  const parsed = useMemo(() => {
    if (!value) return null;
    const parts = value.trim().split(/\s+/);
    if (parts.length >= 2) {
      const monthPart = parts[0];
      const yearPart = parseInt(parts[1], 10);
      const foundMonth = MONTHS.find(
        (m) => m.full.toLowerCase() === monthPart.toLowerCase() || m.short.toLowerCase() === monthPart.toLowerCase()
      );
      if (foundMonth && !isNaN(yearPart)) {
        return { month: foundMonth.full, year: yearPart };
      }
    }
    return null;
  }, [value]);

  const currentYear = new Date().getFullYear();
  const [viewYear, setViewYear] = useState<number>(parsed?.year || currentYear);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Sync viewYear if parsed changes
  useEffect(() => {
    if (parsed?.year) {
      setViewYear(parsed.year);
    }
  }, [parsed?.year]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectMonth = (monthFull: string) => {
    onChange(`${monthFull} ${viewYear}`);
    setIsOpen(false);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const curMonth = MONTHS[now.getMonth()].full;
    const curYear = now.getFullYear();
    setViewYear(curYear);
    onChange(`${curMonth} ${curYear}`);
    setIsOpen(false);
  };

  // Generate selectable year range (e.g. 2020 to 2035)
  const years = Array.from({ length: 16 }, (_, i) => 2020 + i);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3 py-2 text-xs border border-slate-300 bg-white hover:border-slate-400 focus:outline-none focus:border-slate-900 transition flex items-center justify-between text-left font-medium"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className={`font-mono text-xs truncate ${value ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''} shrink-0`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 mt-1 w-72 bg-white border border-slate-300 shadow-xl p-3.5 animate-in fade-in zoom-in-95 duration-100">
          {/* Header: Year Controller */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="p-1 hover:bg-slate-100 text-slate-600 rounded transition"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Year:</span>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="font-mono font-bold text-xs text-slate-900 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded cursor-pointer focus:outline-none focus:border-slate-800"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="p-1 hover:bg-slate-100 text-slate-600 rounded transition"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Hover Month Matrix */}
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Select Month (Hover &amp; Click):</span>
            {hoveredMonth && (
              <span className="text-slate-900 font-bold animate-pulse">
                {hoveredMonth} {viewYear}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m) => {
              const isSelected = parsed?.year === viewYear && parsed?.month === m.full;
              return (
                <button
                  key={m.full}
                  type="button"
                  onMouseEnter={() => setHoveredMonth(m.full)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  onClick={() => handleSelectMonth(m.full)}
                  className={`py-2 px-1 text-center text-xs font-mono rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-extrabold shadow-sm ring-1 ring-slate-900'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white border border-slate-200 hover:border-slate-900 font-medium'
                  }`}
                >
                  <span className="block text-xs font-bold">{m.short}</span>
                  <span className="block text-[9px] opacity-75">{m.full}</span>
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="text-brand-600 hover:text-brand-800 font-bold underline transition"
            >
              Current Month
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

