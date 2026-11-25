import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  ExternalLink
} from 'lucide-react';
import StatusBadge from './StatusBadge';

const Calendar = ({ hearings = [], onSelectHearing, onScheduleNew }) => {
  const [currentDate, setCurrentDate] = useState(new Date('2026-11-05'));
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date('2026-11-05'));
  };

  // Month grid calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

  // Previous month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({
      dayNumber: i,
      dateString: dateStr,
      isCurrentMonth: true,
      isToday: i === 5 && month === 10 && year === 2026, // Nov 5, 2026
    });
  }

  // Next month padding to fill full 35 or 42 grid
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= (remainingDays < 7 ? remainingDays : remainingDays - 7); i++) {
    const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({
      dayNumber: i,
      dateString: dateStr,
      isCurrentMonth: false,
    });
  }

  // Group hearings by date
  const getHearingsForDate = (dateStr) => {
    return hearings.filter(h => h.hearingDate === dateStr);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      {/* Calendar Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#142B4A]/10 text-[#142B4A] dark:bg-sky-950 dark:text-sky-300 rounded-xl">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#142B4A] dark:text-white">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {viewMode === 'month' ? 'Monthly Docket Overview' : viewMode === 'week' ? 'Weekly Hearing Schedule' : 'Daily Court List'}
            </p>
          </div>
        </div>

        {/* View Mode Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {['month', 'week', 'day'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-white dark:bg-slate-900 text-[#142B4A] dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Today Button */}
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-[#142B4A] dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Today
          </button>

          {/* Prev/Next Buttons */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <button
              onClick={handlePrev}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-l-xl transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700" />
            <button
              onClick={handleNext}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-r-xl transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onScheduleNew && (
            <button
              onClick={onScheduleNew}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#142B4A] hover:bg-[#24466B] rounded-xl shadow-sm transition-colors"
            >
              + Schedule Hearing
            </button>
          )}
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="mt-4">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-px mb-1 text-center">
            {daysOfWeek.map((day, idx) => (
              <div
                key={day}
                className={`py-2 text-[11px] font-bold uppercase tracking-wider ${
                  idx === 0 || idx === 6 ? 'text-rose-500/80' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cell, idx) => {
              const dayHearings = getHearingsForDate(cell.dateString);
              return (
                <div
                  key={idx}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-xl border transition-all ${
                    cell.isCurrentMonth
                      ? cell.isToday
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'bg-slate-50/50 dark:bg-slate-950/30 border-transparent text-slate-300 dark:text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        cell.isToday
                          ? 'bg-[#142B4A] text-white shadow-sm'
                          : cell.isCurrentMonth
                          ? 'text-slate-700 dark:text-slate-200'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {dayHearings.length > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#C6A15B]/20 text-[#8E6E32] dark:text-amber-300">
                        {dayHearings.length} {dayHearings.length === 1 ? 'hearing' : 'hearings'}
                      </span>
                    )}
                  </div>

                  {/* Hearing items inside the day */}
                  <div className="space-y-1 overflow-y-auto max-h-[70px]">
                    {dayHearings.map(h => (
                      <div
                        key={h.id}
                        onClick={() => onSelectHearing && onSelectHearing(h)}
                        className="group p-1 rounded-md text-[10px] bg-slate-50 dark:bg-slate-800/80 hover:bg-[#142B4A] hover:text-white border border-slate-200/80 dark:border-slate-700/80 cursor-pointer transition-all line-clamp-1 flex items-center justify-between"
                        title={`${h.hearingTime} - ${h.caseTitle} (${h.courtroom})`}
                      >
                        <span className="font-semibold truncate">{h.caseNumber}</span>
                        <span className="text-[9px] opacity-75">{h.hearingTime.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-slate-500">Upcoming 7-day schedule with court assignments:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {hearings.slice(0, 6).map(h => (
              <div
                key={h.id}
                onClick={() => onSelectHearing && onSelectHearing(h)}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#142B4A] dark:hover:border-sky-400 cursor-pointer shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-[#142B4A] dark:text-white">{h.caseNumber}</span>
                  <StatusBadge status={h.status} />
                </div>
                <h4 className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{h.caseTitle}</h4>
                <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{h.hearingDate} at {h.hearingTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{h.courtName} - {h.courtroom}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{h.assignedLawyer}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="mt-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#142B4A] dark:text-white">Daily Cause List for {currentDate.toISOString().split('T')[0]}</h3>
              <p className="text-xs text-slate-500">Scheduled bench appearances and courtroom items</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#142B4A] text-white">
              {hearings.filter(h => h.hearingDate === currentDate.toISOString().split('T')[0]).length || 2} Hearings
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {hearings.slice(0, 4).map(h => (
              <div
                key={h.id}
                onClick={() => onSelectHearing && onSelectHearing(h)}
                className="py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 text-center py-1.5 px-2 bg-[#142B4A]/10 text-[#142B4A] dark:bg-sky-950 dark:text-sky-300 rounded-lg text-xs font-bold">
                    {h.hearingTime}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#142B4A] dark:text-white">{h.caseNumber}</span>
                      <StatusBadge status={h.status} />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{h.caseTitle}</p>
                    <p className="text-xs text-slate-500">{h.courtName} • {h.courtroom} • {h.hearingType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs text-slate-500 font-medium">{h.assignedLawyer}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
