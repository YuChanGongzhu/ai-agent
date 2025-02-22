import React, { useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
    "zh-CN": zhCN,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface Event {
    id: number;
    title: string;
    start: Date;
    end: Date;
    type?: "appointment" | "normal";
}

export const CalendarComponent: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([
        {
            id: 1,
            title: "有约事项",
            start: new Date(2020, 4, 13, 10, 0),
            end: new Date(2020, 4, 13, 11, 0),
            type: "appointment"
        },
        {
            id: 2,
            title: "普通事项",
            start: new Date(2020, 4, 13, 14, 0),
            end: new Date(2020, 4, 13, 15, 0),
            type: "normal"
        }
    ]);

    const eventStyleGetter = (event: Event) => {
        let style: React.CSSProperties = {
            backgroundColor: event.type === "appointment" ? "#9333ea" : "#3b82f6",
            borderRadius: "4px",
            opacity: 0.8,
            color: "white",
            border: "0",
            display: "block"
        };
        return {
            style
        };
    };

    const messages = {
        today: "今天",
        previous: "上个月",
        next: "下个月",
        month: "月",
        week: "周",
        day: "日",
        agenda: "日程",
        date: "日期",
        time: "时间",
        event: "事项",
        noEventsInRange: "没有事项",
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventType, setNewEventType] = useState<'normal' | 'appointment'>('normal');
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

    const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
        setSelectedSlot({ start, end });
        setIsModalOpen(true);
    };

    const handleCreateEvent = () => {
        if (selectedSlot && newEventTitle.trim()) {
            const newEvent: Event = {
                id: events.length + 1,
                title: newEventTitle,
                start: selectedSlot.start,
                end: selectedSlot.end,
                type: newEventType
            };
            setEvents([...events, newEvent]);
            setIsModalOpen(false);
            setNewEventTitle('');
            setNewEventType('normal');
            setSelectedSlot(null);
        }
    };

    const handleSelectEvent = (event: Event) => {
        const action = window.confirm(`是否删除事项: ${event.title}?`);
        if (action) {
            setEvents(events.filter(e => e.id !== event.id));
        }
    };

    const handleNavigate = (newDate: Date) => {
        setCurrentDate(newDate);
    };

    const formatDateTime = (date: Date) => {
        return format(date, 'yyyy-MM-dd HH:mm');
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 h-full relative">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-medium">日历</h2>
                <div className="flex items-center space-x-4">
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
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "calc(100vh - 200px)" }}
                eventPropGetter={eventStyleGetter}
                messages={messages}
                views={["month"]}
                defaultView={Views.MONTH}
                date={currentDate}
                popup
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                onNavigate={handleNavigate}
            />
            {/* Event Creation Modal */}
            <dialog id="event_modal" className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">创建新事项</h3>
                    
                    {selectedSlot && (
                        <div className="text-sm text-gray-600 mb-4">
                            <div>开始时间: {formatDateTime(selectedSlot.start)}</div>
                            <div>结束时间: {formatDateTime(selectedSlot.end)}</div>
                        </div>
                    )}

                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text">事项名称</span>
                        </label>
                        <input 
                            type="text" 
                            value={newEventTitle}
                            onChange={(e) => setNewEventTitle(e.target.value)}
                            className="input input-bordered w-full" 
                            placeholder="请输入事项名称"
                        />
                    </div>

                    <div className="form-control w-full mt-4">
                        <label className="label">
                            <span className="label-text">事项类型</span>
                        </label>
                        <select 
                            className="select select-bordered w-full"
                            value={newEventType}
                            onChange={(e) => setNewEventType(e.target.value as 'normal' | 'appointment')}
                        >
                            <option value="normal">普通事项</option>
                            <option value="appointment">预约事项</option>
                        </select>
                    </div>

                    <div className="modal-action">
                        <button 
                            className="btn btn-primary" 
                            onClick={handleCreateEvent}
                            disabled={!newEventTitle.trim()}
                        >
                            创建
                        </button>
                        <button 
                            className="btn" 
                            onClick={() => {
                                setIsModalOpen(false);
                                setNewEventTitle('');
                                setNewEventType('normal');
                                setSelectedSlot(null);
                            }}
                        >
                            取消
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={() => setIsModalOpen(false)}>close</button>
                </form>
            </dialog>
        </div>
    );
};
