import React, { useState } from 'react';
import clsx from 'clsx';

interface Event {
    id: number;
    type: 1 | 2; // 1 for 有约, 2 for normal event
    date: string;
}

export const CalendarMap: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date(2020, 4)); // May 2020
    const [selectedDate, setSelectedDate] = useState<number | null>(null);

    const events: Event[] = [
        { id: 1, type: 1, date: '2020-05-13' },
        { id: 2, type: 2, date: '2020-05-13' }
    ];

    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const days = [];
        const prevMonthDays = firstDay.getDay();
        const lastDateOfPrevMonth = new Date(year, month, 0).getDate();
        
        // Previous month days
        for (let i = prevMonthDays - 1; i >= 0; i--) {
            days.push({
                date: lastDateOfPrevMonth - i,
                isCurrentMonth: false,
                isPrevMonth: true
            });
        }
        
        // Current month days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({
                date: i,
                isCurrentMonth: true,
                isPrevMonth: false
            });
        }
        
        // Next month days
        const remainingDays = 42 - days.length; // 6 rows * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: i,
                isCurrentMonth: false,
                isPrevMonth: false
            });
        }
        
        return days;
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const formatMonth = (date: Date) => {
        return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`;
    };

    const days = getDaysInMonth(currentDate);

    const getEventsForDate = (year: number, month: number, day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(event => event.date === dateStr);
    };

    const getLunarDay = (day: number) => {
        // This is a simplified version. In a real app, you'd want to use a lunar calendar library
        return `十${day}`;
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <button onClick={handlePrevMonth} className="text-gray-600 hover:text-gray-900">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-xl font-medium">{formatMonth(currentDate)}</h2>
                    <button onClick={handleNextMonth} className="text-gray-600 hover:text-gray-900">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                <div className="flex items-center space-x-4">
                    <button className="text-sm text-blue-600">今天</button>
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm mr-1"></div>
                            <span className="text-sm text-gray-600">未至</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-sm mr-1"></div>
                            <span className="text-sm text-gray-600">有约</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* Weekday headers */}
                {weekDays.map((day, index) => (
                    <div key={day} className="bg-white p-2 text-center text-sm text-gray-600">
                        {day}
                    </div>
                ))}

                {/* Calendar days */}
                {days.map((day, index) => {
                    const dayEvents = day.isCurrentMonth
                        ? getEventsForDate(
                            currentDate.getFullYear(),
                            currentDate.getMonth(),
                            day.date
                        )
                        : [];

                    return (
                        <div
                            key={index}
                            className={clsx(
                                'bg-white p-2 min-h-[80px] relative',
                                !day.isCurrentMonth && 'text-gray-400',
                                selectedDate === day.date && day.isCurrentMonth && 'bg-gray-50'
                            )}
                            onClick={() => day.isCurrentMonth && setSelectedDate(day.date)}
                        >
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start">
                                    <span className="text-lg">{day.date}</span>
                                    <span className="text-xs text-gray-500">
                                        {getLunarDay(day.date)}
                                    </span>
                                </div>
                                {dayEvents.length > 0 && (
                                    <div className="mt-1 space-y-1">
                                        {dayEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                className={clsx(
                                                    'w-4 h-4 rounded-sm',
                                                    event.type === 1 ? 'bg-purple-500' : 'bg-blue-500'
                                                )}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
