'use client';

import { useState, useEffect, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DateTimeRangePickerProps {
  value?: { start: Date | null; end: Date | null };
  onChange?: (value: { start: Date | null; end: Date | null }) => void;
  placeholder?: string;
  showTime?: boolean; // 是否显示时间选择器
  width?: string; // 自定义宽度
}

export default function DateTimeRangePicker({ value, onChange, placeholder = '选择日期时间范围', showTime = true, width = '280px' }: DateTimeRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalStart, setInternalStart] = useState<Date | null>(value?.start || null);
  const [internalEnd, setInternalEnd] = useState<Date | null>(value?.end || null);
  const [startMonth, setStartMonth] = useState(new Date());
  const [endMonth, setEndMonth] = useState(new Date());
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  // 同步外部 value 到内部状态
  useEffect(() => {
    if (value) {
      setInternalStart(value.start);
      setInternalEnd(value.end);
    }
  }, [value]);

  // 计算弹出面板位置
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      setPanelPosition({
        top: rect.bottom + scrollTop + 8,
        left: Math.max(8, Math.min(rect.left + scrollLeft, window.innerWidth - 816)),
      });
    }
  }, [isOpen]);

  const handleDateSelectStart = (date: Date | undefined) => {
    if (date) {
      const newStart = new Date(date);
      newStart.setHours(internalStart?.getHours() || 0, internalStart?.getMinutes() || 0, internalStart?.getSeconds() || 0);
      setInternalStart(newStart);
    }
  };

  const handleDateSelectEnd = (date: Date | undefined) => {
    if (date) {
      const newEnd = new Date(date);
      newEnd.setHours(internalEnd?.getHours() || 23, internalEnd?.getMinutes() || 59, internalEnd?.getSeconds() || 59);
      setInternalEnd(newEnd);
    }
  };

  const handleTimeChange = (field: 'start' | 'end', type: 'hours' | 'minutes' | 'seconds', value: number) => {
    const date = field === 'start' ? internalStart : internalEnd;
    if (!date) return;

    const newDate = new Date(date);
    if (type === 'hours') {
      newDate.setHours(value);
    } else if (type === 'minutes') {
      newDate.setMinutes(value);
    } else {
      newDate.setSeconds(value);
    }

    if (field === 'start') {
      setInternalStart(newDate);
    } else {
      setInternalEnd(newDate);
    }
  };

  const handleClear = () => {
    setInternalStart(null);
    setInternalEnd(null);
    onChange?.({ start: null, end: null });
    setIsOpen(false);
  };

  const handleConfirm = () => {
    onChange?.({ start: internalStart, end: internalEnd });
    setIsOpen(false);
  };

  const handleClose = () => {
    // 关闭时自动应用当前选择的值
    onChange?.({ start: internalStart, end: internalEnd });
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!internalStart && !internalEnd) return placeholder;
    const dateFormat = 'yyyy-MM-dd';
    const timeFormat = ' HH:mm:ss';
    const formatStr = showTime ? dateFormat + timeFormat : dateFormat;

    const startStr = internalStart ? format(internalStart, formatStr) : '未选择';
    const endStr = internalEnd ? format(internalEnd, formatStr) : '未选择';
    return `${startStr} 至 ${endStr}`;
  };

  const TimePicker = ({ date, field }: { date: Date | null; field: 'start' | 'end' }) => {
    const hours = date?.getHours() || 0;
    const minutes = date?.getMinutes() || 0;
    const seconds = date?.getSeconds() || 0;

    return (
      <div className="flex gap-2">
        {['hours', 'minutes', 'seconds'].map((type) => (
          <div key={type} className="flex flex-col items-center">
            <div className="text-sm font-semibold mb-1 text-blue-600">
              {type === 'hours' ? '时' : type === 'minutes' ? '分' : '秒'}
            </div>
            <select
              value={type === 'hours' ? hours : type === 'minutes' ? minutes : seconds}
              onChange={(e) => handleTimeChange(field, type as any, parseInt(e.target.value))}
              className="w-16 h-24 border border-gray-200 rounded text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: type === 'hours' ? 24 : 60 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* 触发器 */}
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 overflow-hidden h-9"
        style={{ width }}
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="flex-1 text-sm whitespace-nowrap overflow-hidden">
          {formatDateRange()}
        </span>
        {internalStart && internalEnd && (
          <X
            className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-700 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          />
        )}
      </div>

      {/* 弹出面板 */}
      {isOpen && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl p-6 w-[800px]"
          style={{ top: `${panelPosition.top}px`, left: `${panelPosition.left}px`, zIndex: 100 }}
        >
          {/* 顶部：显示当前选择的时间 */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm font-semibold text-blue-700">
              已选择: {formatDateRange()}
            </div>
          </div>

          {/* 双栏布局 */}
          <div className="grid grid-cols-2 gap-6">
            {/* 左侧：起始时间 */}
            <div>
              {/* 日历 */}
              <DayPicker
                mode="single"
                selected={internalStart || undefined}
                onSelect={handleDateSelectStart}
                month={startMonth}
                onMonthChange={setStartMonth}
                locale={zhCN}
                className="border border-gray-200 rounded mb-3"
              />

              {/* 时间选择器 */}
              {showTime && (
                <div className="border border-gray-200 rounded p-3 bg-gray-50">
                  <TimePicker date={internalStart} field="start" />
                </div>
              )}
            </div>

            {/* 右侧：结束时间 */}
            <div>
              {/* 日历 */}
              <DayPicker
                mode="single"
                selected={internalEnd || undefined}
                onSelect={handleDateSelectEnd}
                month={endMonth}
                onMonthChange={setEndMonth}
                locale={zhCN}
                className="border border-gray-200 rounded mb-3"
              />

              {/* 时间选择器 */}
              {showTime && (
                <div className="border border-gray-200 rounded p-3 bg-gray-50">
                  <TimePicker date={internalEnd} field="end" />
                </div>
              )}
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              清除
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              确认
            </button>
          </div>
        </div>
      )}

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          style={{ zIndex: 999 }}
          onClick={handleClose}
        />
      )}
    </div>
  );
}
