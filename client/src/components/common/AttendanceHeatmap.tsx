import React, { useMemo } from 'react';

interface AttendanceHeatmapProps {
  dayMap: Record<string, 'present' | 'absent' | 'late'>;
  title?: string;
}

export const AttendanceHeatmap: React.FC<AttendanceHeatmapProps> = ({ dayMap = {}, title }) => {
  // Generate 52 weeks (364 days) leading up to today
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const resultWeeks: Array<Array<{ dateStr: string; status: string; dayIndex: number }>> = [];
    const months: Array<{ label: string; weekIndex: number }> = [];

    let currentWeek: Array<{ dateStr: string; status: string; dayIndex: number }> = [];
    let lastMonth = -1;

    // Start 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);

    for (let i = 0; i < 365; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const dateStr = d.toISOString().split('T')[0];
      const status = dayMap[dateStr] || 'none';
      const dayIndex = d.getDay(); // 0 is Sunday, 6 is Saturday

      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        const monthName = d.toLocaleString('default', { month: 'short' });
        months.push({ label: monthName, weekIndex: resultWeeks.length });
      }

      currentWeek.push({ dateStr, status, dayIndex });

      if (dayIndex === 6 || i === 364) {
        resultWeeks.push(currentWeek);
        currentWeek = [];
      }
    }

    return { weeks: resultWeeks, monthLabels: months };
  }, [dayMap]);

  const getColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-500 hover:ring-2 hover:ring-emerald-400';
      case 'late':
        return 'bg-amber-400 hover:ring-2 hover:ring-amber-300';
      case 'absent':
        return 'bg-rose-500 hover:ring-2 hover:ring-rose-400';
      default:
        return 'bg-slate-100 hover:bg-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title || 'Annual Attendance Grid (365 Days)'}</h3>
          <p className="text-xs text-slate-500">Day-by-day academic session attendance record</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
            <span>No class</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-[700px]">
          {/* Months header */}
          <div className="flex text-[11px] text-slate-400 mb-1.5 pl-6 gap-8">
            {monthLabels.map((m, idx) => (
              <span key={idx} className="font-medium">{m.label}</span>
            ))}
          </div>

          <div className="flex gap-1.5">
            {/* Days of week labels */}
            <div className="flex flex-col justify-between text-[10px] text-slate-400 pr-2 py-0.5">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-1.5">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      title={`${day.dateStr}: ${day.status !== 'none' ? day.status.toUpperCase() : 'No session'}`}
                      className={`w-3 h-3 rounded-sm transition-all cursor-pointer ${getColor(day.status)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
