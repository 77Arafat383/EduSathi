import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';

export interface AttendanceSessionItem {
  courseTitle: string;
  courseId?: string;
  sessionTitle: string;
  status: 'present' | 'absent' | 'late' | string;
}

export interface DayDetail {
  date: string;
  status: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalClasses: number;
  sessions: AttendanceSessionItem[];
}

interface AttendanceHeatmapProps {
  dayMap?: Record<string, string>;
  dayDetails?: Record<string, DayDetail>;
  records?: any[];
  title?: string;
}

interface HoveredDayState {
  dateStr: string;
  isToday: boolean;
  dayOfWeek: number;
  monthIndex: number;
  dayDetail?: DayDetail;
  x: number;
  y: number;
}

const DAY_LABELS = [
  { full: 'Sunday', short: 'Sun' },
  { full: 'Monday', short: 'Mon' },
  { full: 'Tuesday', short: 'Tue' },
  { full: 'Wednesday', short: 'Wed' },
  { full: 'Thursday', short: 'Thu' },
  { full: 'Friday', short: 'Fri' },
  { full: 'Saturday', short: 'Sat' },
];

export const AttendanceHeatmap: React.FC<AttendanceHeatmapProps> = ({
  dayMap = {},
  dayDetails = {},
  records = [],
  title,
}) => {
  const [hoveredDay, setHoveredDay] = useState<HoveredDayState | null>(null);
  const todayDayOfWeek = useMemo(() => new Date().getDay(), []);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!gridContainerRef.current) return;
    const el = gridContainerRef.current;
    const handleResize = () => {
      if (el) {
        setContainerWidth(el.clientWidth);
      }
    };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Normalize details map from dayDetails and fallback to records
  const detailsMap = useMemo(() => {
    const map: Record<string, DayDetail> = {};

    // Copy dayDetails if provided
    if (dayDetails && typeof dayDetails === 'object') {
      for (const [k, v] of Object.entries(dayDetails)) {
        if (v && typeof v === 'object') {
          map[k] = v;
        }
      }
    }

    // Merge or construct from records if details are missing
    if (Array.isArray(records)) {
      for (const r of records) {
        if (!r.session_date) continue;

        let dStr = '';
        if (r.session_date instanceof Date) {
          const y = r.session_date.getFullYear();
          const m = String(r.session_date.getMonth() + 1).padStart(2, '0');
          const d = String(r.session_date.getDate()).padStart(2, '0');
          dStr = `${y}-${m}-${d}`;
        } else if (typeof r.session_date === 'string') {
          const dObj = new Date(r.session_date);
          if (!isNaN(dObj.getTime())) {
            const y = dObj.getFullYear();
            const m = String(dObj.getMonth() + 1).padStart(2, '0');
            const d = String(dObj.getDate()).padStart(2, '0');
            dStr = `${y}-${m}-${d}`;
          } else {
            dStr = r.session_date.split('T')[0];
          }
        }

        if (!dStr) continue;

        if (!map[dStr]) {
          map[dStr] = {
            date: dStr,
            status: 'none',
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            totalClasses: 0,
            sessions: [],
          };
        }

        const day = map[dStr];
        const status = r.status || 'present';

        const exists = day.sessions.some(
          (s) => s.sessionTitle === r.session_title && s.courseTitle === r.course_title
        );

        if (!exists) {
          day.totalClasses += 1;
          if (status === 'present') day.presentCount += 1;
          else if (status === 'late') day.lateCount += 1;
          else if (status === 'absent') day.absentCount += 1;

          day.sessions.push({
            courseTitle: r.course_title || 'Course Session',
            courseId: r.course_id,
            sessionTitle: r.session_title || 'Class Session',
            status,
          });
        }
      }
    }

    return map;
  }, [dayDetails, records]);

  // 52 weeks leading up to today (Sun=0 to Sat=6)
  const { today, todayFormatted, gridStartDate, weeks } = useMemo(() => {
    const t = new Date();
    t.setHours(12, 0, 0, 0); // Noon prevents DST midnight shifts

    const ty = t.getFullYear();
    const tm = String(t.getMonth() + 1).padStart(2, '0');
    const td = String(t.getDate()).padStart(2, '0');
    const formatted = `${ty}-${tm}-${td}`;

    // Sunday of the current week (dow 0)
    const sow = new Date(t);
    sow.setDate(t.getDate() - t.getDay());

    // 51 full weeks before this week = total 52 columns!
    const gStart = new Date(sow);
    gStart.setDate(sow.getDate() - 51 * 7);

    // Build 52 columns, each having exactly 7 day slots (Sun=0 to Sat=6)
    const resultWeeks: Array<
      Array<{
        dateStr: string;
        date: Date;
        dayOfWeek: number;
        isToday: boolean;
        isFuture: boolean;
      }>
    > = [];

    for (let col = 0; col < 52; col++) {
      const colDays: Array<{
        dateStr: string;
        date: Date;
        dayOfWeek: number;
        isToday: boolean;
        isFuture: boolean;
      }> = [];

      for (let dow = 0; dow < 7; dow++) {
        const d = new Date(gStart);
        d.setDate(gStart.getDate() + col * 7 + dow);

        const cy = d.getFullYear();
        const cm = String(d.getMonth() + 1).padStart(2, '0');
        const cd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${cy}-${cm}-${cd}`;
        const isToday = dateStr === formatted;
        const isFuture = dateStr > formatted;

        colDays.push({
          dateStr,
          date: new Date(d),
          dayOfWeek: dow,
          isToday,
          isFuture,
        });
      }

      resultWeeks.push(colDays);
    }

    return {
      today: t,
      todayFormatted: formatted,
      gridStartDate: gStart,
      weeks: resultWeeks,
    };
  }, []);

  // Dynamic responsive sizing to fit full container width
  const isLarge = containerWidth > 1100;
  const dayColWidth = isLarge ? 42 : 36;
  const colGap = isLarge ? 4 : 3.5;
  const minGridWidth = 52 * 12 + 51 * colGap; // ~802px minimum

  const availableGridWidth = Math.max(
    minGridWidth,
    containerWidth > 0 ? containerWidth - dayColWidth - 8 : minGridWidth
  );

  // Exact cell size to fill availableGridWidth across 52 columns with 51 gaps
  const cellSize = Math.max(12, (availableGridWidth - 51 * colGap) / 52);
  const step = cellSize + colGap;
  const totalGridWidth = 52 * cellSize + 51 * colGap;

  // Calculate month label positions dynamically matching column step
  const monthLabels = useMemo(() => {
    const months: Array<{ label: string; colIndex: number; leftPx: number; month: number }> = [];
    let lastLabeledCol = -10;

    for (let col = 0; col < 52; col++) {
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(gridStartDate);
        dayDate.setDate(gridStartDate.getDate() + col * 7 + d);
        if (dayDate.getDate() === 1 && dayDate.getTime() <= today.getTime() + 86400000) {
          if (col - lastLabeledCol >= 2) {
            months.push({
              label: dayDate.toLocaleString('default', { month: 'short' }),
              colIndex: col,
              leftPx: col * step,
              month: dayDate.getMonth(),
            });
            lastLabeledCol = col;
          }
          break;
        }
      }
    }
    return months;
  }, [gridStartDate, today, step]);

  // Compute color based on specifications:
  // - No class: white
  // - Class available but not attended: red
  // - Class attended: green
  // - Average / mixed: middle (amber/orange/lime based on whether absent or present is more)
  const getCellVisual = (info?: DayDetail) => {
    if (!info || info.totalClasses === 0) {
      return {
        bgClass: 'bg-white border border-slate-200/90 hover:border-slate-400',
        label: 'No class',
      };
    }

    const { presentCount, absentCount, lateCount, totalClasses } = info;

    // 1. All classes attended -> Green
    if (presentCount === totalClasses) {
      return {
        bgClass: 'bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 shadow-2xs',
        label: '100% Attended',
      };
    }

    // 2. Class was available but user didn't attend -> Red
    if (absentCount === totalClasses) {
      return {
        bgClass: 'bg-rose-500 hover:bg-rose-600 border border-rose-600 shadow-2xs',
        label: '100% Missed',
      };
    }

    // 3. All classes late -> Amber
    if (lateCount === totalClasses) {
      return {
        bgClass: 'bg-amber-400 hover:bg-amber-500 border border-amber-500 shadow-2xs',
        label: 'Late',
      };
    }

    // 4. Mixed / Average based on which part is more
    if (presentCount > absentCount) {
      return {
        bgClass: 'bg-lime-500 hover:bg-lime-600 border border-lime-600 shadow-2xs',
        label: `Mostly Attended (${presentCount}/${totalClasses})`,
      };
    } else if (absentCount > presentCount) {
      return {
        bgClass: 'bg-orange-500 hover:bg-orange-600 border border-orange-600 shadow-2xs',
        label: `Mostly Missed (${absentCount}/${totalClasses})`,
      };
    } else {
      return {
        bgClass: 'bg-amber-400 hover:bg-amber-500 border border-amber-500 shadow-2xs',
        label: `50% Attendance (${presentCount}/${totalClasses})`,
      };
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm relative">
      {/* Header & Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              {title || '12-Month Academic Attendance Heatmap'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Every cell represents a day. Hover over any cell to see courses and attendance details.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70">
          <div className="flex items-center gap-1.5" title="No academic classes scheduled">
            <span className="w-3 h-3 rounded-xs bg-white border border-slate-300" />
            <span className="text-[11px] font-medium text-slate-600">No Class</span>
          </div>

          <div className="flex items-center gap-1.5" title="Missed session (Absent)">
            <span className="w-3 h-3 rounded-xs bg-rose-500 border border-rose-600" />
            <span className="text-[11px] font-medium text-slate-700">Missed</span>
          </div>

          <div className="flex items-center gap-1.5" title="More absent than present">
            <span className="w-3 h-3 rounded-xs bg-orange-500 border border-orange-600" />
            <span className="text-[11px] font-medium text-slate-700">Mostly Missed</span>
          </div>

          <div className="flex items-center gap-1.5" title="50% attendance or late">
            <span className="w-3 h-3 rounded-xs bg-amber-400 border border-amber-500" />
            <span className="text-[11px] font-medium text-slate-700">Average</span>
          </div>

          <div className="flex items-center gap-1.5" title="More present than absent">
            <span className="w-3 h-3 rounded-xs bg-lime-500 border border-lime-600" />
            <span className="text-[11px] font-medium text-slate-700">Mostly Attended</span>
          </div>

          <div className="flex items-center gap-1.5" title="Attended session (Present)">
            <span className="w-3 h-3 rounded-xs bg-emerald-500 border border-emerald-600" />
            <span className="text-[11px] font-medium text-slate-700">Attended</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div ref={gridContainerRef} className="w-full overflow-x-auto pb-3 pt-1">
        <div
          className="inline-block select-none"
          style={{ minWidth: `${totalGridWidth + dayColWidth}px`, width: '100%' }}
        >
          {/* Month Header Labels: Pixel-perfect aligned above each corresponding week column */}
          <div className="flex items-center mb-2 select-none">
            {/* Matches day labels column width exactly */}
            <div className="shrink-0 pr-2" style={{ width: `${dayColWidth}px` }} />
            <div className="relative h-5" style={{ width: `${totalGridWidth}px` }}>
              {monthLabels.map((m, idx) => {
                const isHoveredMonth = hoveredDay?.monthIndex === m.month;
                return (
                  <span
                    key={idx}
                    className={`absolute whitespace-nowrap transition-colors duration-150 ${isLarge ? 'text-xs' : 'text-[11px]'
                      } ${isHoveredMonth
                        ? 'font-extrabold text-brand-600 scale-105'
                        : 'font-bold text-slate-400'
                      }`}
                    style={{ left: `${m.leftPx}px` }}
                  >
                    {m.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Days of Week (Rows) and Weeks (Columns) */}
          <div className="flex items-start">
            {/* Days of week labels: Exactly 7 rows aligned 1-to-1 with cells */}
            <div
              className="flex flex-col select-none shrink-0"
              style={{ width: `${dayColWidth}px`, gap: `${colGap}px` }}
            >
              {DAY_LABELS.map((day, i) => {
                const isTodayRow = i === todayDayOfWeek;
                const isHoveredRow = hoveredDay?.dayOfWeek === i;

                return (
                  <div
                    key={i}
                    className={`flex items-center justify-end pr-2 leading-none transition-colors duration-150 ${isLarge ? 'text-[11px]' : 'text-[10px]'
                      } ${isHoveredRow
                        ? 'font-extrabold text-brand-600'
                        : isTodayRow
                          ? 'font-bold text-slate-800'
                          : 'font-semibold text-slate-400'
                      }`}
                    style={{ height: `${cellSize}px` }}
                    title={`${day.full}${isTodayRow ? ' (Today)' : ''}`}
                  >
                    {day.short}
                  </div>
                );
              })}
            </div>

            {/* Weeks Columns: 52 columns of 7 day rows */}
            <div className="flex" style={{ gap: `${colGap}px` }}>
              {weeks.map((week, wIdx) => (
                <div
                  key={wIdx}
                  className="flex flex-col"
                  style={{ width: `${cellSize}px`, gap: `${colGap}px` }}
                >
                  {week.map((day) => {
                    // Future days in current week are rendered invisible to preserve alignment
                    if (day.isFuture) {
                      return (
                        <div
                          key={day.dateStr}
                          style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                          className="rounded-xs invisible pointer-events-none"
                        />
                      );
                    }

                    const info = detailsMap[day.dateStr];
                    const visual = getCellVisual(info);
                    const isTodayCell = day.isToday;

                    return (
                      <div
                        key={day.dateStr}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay({
                            dateStr: day.dateStr,
                            isToday: isTodayCell,
                            dayOfWeek: day.dayOfWeek,
                            monthIndex: day.date.getMonth(),
                            dayDetail: info,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                        className={`rounded-xs transition-transform transform hover:scale-125 cursor-pointer relative ${visual.bgClass
                          } ${isTodayCell ? 'ring-2 ring-brand-500 ring-offset-1 z-10' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip / Popup */}
      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2.5 transition-all duration-100 ease-out animate-in fade-in zoom-in-95"
          style={{
            left: `${Math.max(120, Math.min(window.innerWidth - 140, hoveredDay.x))}px`,
            top: `${hoveredDay.y - 8}px`,
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl p-3 shadow-xl border border-slate-700/80 min-w-[210px] max-w-[280px]">
            {/* Tooltip Header */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
              <span className="font-bold text-slate-200">
                {formatDisplayDate(hoveredDay.dateStr)}
              </span>
              {hoveredDay.isToday && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-brand-500 text-white uppercase tracking-wider">
                  Today
                </span>
              )}
            </div>

            {/* Tooltip Content */}
            {!hoveredDay.dayDetail || hoveredDay.dayDetail.totalClasses === 0 ? (
              <div className="flex items-center gap-2 py-1 text-slate-400 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>No class sessions scheduled</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Attendance:</span>
                  <span
                    className={`font-bold ${hoveredDay.dayDetail.presentCount === hoveredDay.dayDetail.totalClasses
                      ? 'text-emerald-400'
                      : hoveredDay.dayDetail.absentCount === hoveredDay.dayDetail.totalClasses
                        ? 'text-rose-400'
                        : 'text-amber-400'
                      }`}
                  >
                    {hoveredDay.dayDetail.presentCount}/{hoveredDay.dayDetail.totalClasses} Attended
                  </span>
                </div>

                {/* Course List */}
                <div className="space-y-1.5 pt-1">
                  {hoveredDay.dayDetail.sessions.map((sess, sIdx) => {
                    const isPresent = sess.status === 'present';
                    const isLate = sess.status === 'late';
                    const isAbsent = sess.status === 'absent';

                    return (
                      <div
                        key={sIdx}
                        className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-200 text-[11px] truncate leading-tight">
                            {sess.courseTitle}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {sess.sessionTitle}
                          </p>
                        </div>

                        <div className="shrink-0 mt-0.5">
                          {isPresent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Present
                            </span>
                          )}
                          {isLate && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                              <Clock className="w-2.5 h-2.5" /> Late
                            </span>
                          )}
                          {isAbsent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50">
                              <XCircle className="w-2.5 h-2.5" /> Absent
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Little bottom triangle arrow */}
            <div className="absolute left-1/2 -bottom-1 transform -translate-x-1/2 w-2 h-2 bg-slate-900/95 rotate-45 border-r border-b border-slate-700/80" />
          </div>
        </div>
      )}
    </div>
  );
};
