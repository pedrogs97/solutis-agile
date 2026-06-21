import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Demand, User } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  Plus, 
  Check, 
  X, 
  AlertCircle, 
  Video, 
  Bell, 
  Sparkles,
  MapPin,
  Flame,
  ArrowRight
} from 'lucide-react';

export interface SharedMeeting {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  hostId: string;
  hostName: string;
  guestId: string;
  guestName: string;
  status: 'PENDENTE' | 'ACEITO' | 'RECUSADO';
}

interface CalendarViewProps {
  demands: Demand[];
  users: User[];
  currentUser: User;
  meetings: SharedMeeting[];
  onAddMeeting: (meeting: SharedMeeting) => void;
  onUpdateMeetingStatus: (meetingId: string, status: 'ACEITO' | 'RECUSADO') => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  demands,
  users,
  currentUser,
  meetings,
  onAddMeeting,
  onUpdateMeetingStatus
}) => {
  const [viewType, setViewType] = useState<'MONTH' | 'WEEK'>('MONTH');
  
  // Current calendar pivot date pointer
  const [pivotDate, setPivotDate] = useState<Date>(() => new Date());

  // Meeting form modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('14:00');
  const [invitedUserId, setInvitedUserId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Selected calendar day to review list of events
  const [selectedDayString, setSelectedDayString] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Calculate year and month values
  const year = pivotDate.getFullYear();
  const month = pivotDate.getMonth();

  // Navigation handlers
  const handlePrevPivot = () => {
    if (viewType === 'MONTH') {
      setPivotDate(new Date(year, month - 1, 1));
    } else {
      const nextWeek = new Date(pivotDate.getTime());
      nextWeek.setDate(nextWeek.getDate() - 7);
      setPivotDate(nextWeek);
    }
  };

  const handleNextPivot = () => {
    if (viewType === 'MONTH') {
      setPivotDate(new Date(year, month + 1, 1));
    } else {
      const nextWeek = new Date(pivotDate.getTime());
      nextWeek.setDate(nextWeek.getDate() + 7);
      setPivotDate(nextWeek);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setPivotDate(today);
    setSelectedDayString(today.toISOString().split('T')[0]);
  };

  const monthName = pivotDate.toLocaleString('pt-BR', { month: 'long' });

  // Generate list of days of month
  const monthDaysArray = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // Weekday index for 1st day (0 is Sunday, etc)
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate(); // Total days in this month
    const daysInPrevMonth = new Date(year, month, 0).getDate(); // Total days in previous month

    const days: Date[] = [];

    // Fill preceding days of previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, daysInPrevMonth - i));
    }

    // Fill actual month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Fill trailing days (next month padding to complete 42 cells grid pattern)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }, [year, month]);

  // Generate list of days of current week based on pivotDate
  const weekDaysArray = useMemo(() => {
    const dayOfWeek = pivotDate.getDay(); // 0 is Sunday, 1 is Monday ...
    const startOfWeek = new Date(pivotDate);
    startOfWeek.setDate(pivotDate.getDate() - dayOfWeek); // Set to sunday

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [pivotDate]);

  // Filter out and categorize active events for any day
  const getEventsForDay = (dateStr: string) => {
    // 1. Deadlines (Due Dates) of relevant demands
    const deadlines = demands.filter(d => {
      // Must matched YYYY-MM-DD
      const matchesDate = d.dueDate === dateStr;
      
      // If solicitante, only show their items
      if (currentUser.role === 'SOLICITANTE' && d.solicitorId !== currentUser.id && d.assigneeId !== currentUser.id && !d.observerIds.includes(currentUser.id)) {
        return false;
      }
      return matchesDate;
    });

    // 2. Scheduled Meetings involving the currentUser
    const dayMeetings = meetings.filter(m => {
      const isMyMeet = m.hostId === currentUser.id || m.guestId === currentUser.id;
      const matchesDate = m.date === dateStr;
      return isMyMeet && matchesDate && m.status !== 'RECUSADO';
    });

    return { deadlines, meetings: dayMeetings };
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !newTime || !invitedUserId) {
      setErrorMsg('Por favor, preencha todos os campos e convide outro colaborador.');
      return;
    }
    if (invitedUserId === currentUser.id) {
      setErrorMsg('Você não pode convidar a si mesmo para uma reunião.');
      return;
    }

    const guestObj = users.find(u => u.id === invitedUserId);
    if (!guestObj) {
      setErrorMsg('Convidado inválido.');
      return;
    }

    const meeting: SharedMeeting = {
      id: `meet-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      date: newDate,
      time: newTime,
      hostId: currentUser.id,
      hostName: currentUser.name,
      guestId: guestObj.id,
      guestName: guestObj.name,
      status: 'PENDENTE' // Guest must approve/accept
    };

    onAddMeeting(meeting);
    
    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewDate('');
    setErrorMsg('');
    setShowFormModal(false);
  };

  // Reuniões pendentes de aceite do usuário
  const pendingInvites = useMemo(() => {
    return meetings.filter(m => m.guestId === currentUser.id && m.status === 'PENDENTE');
  }, [meetings, currentUser]);

  const selectedDayEvents = useMemo(() => {
    return getEventsForDay(selectedDayString);
  }, [selectedDayString, demands, meetings]);

  return (
    <div id="calendar-view-root" className="space-y-6 text-left">
      
      {/* 1. Shared meeting notices & alerts */}
      <AnimatePresence>
        {pendingInvites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3"
          >
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wide">
              <Bell className="w-4 h-4 text-amber-600 animate-bounce" /> Convites de Reuniões Pendentes de Aceite ({pendingInvites.length})
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="bg-white p-3.5 rounded-xl border border-amber-150 shadow-xs flex justify-between gap-4 text-xs font-medium">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Video className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      {invite.title}
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-snug">
                      Organizado por: <strong className="text-slate-700">{invite.hostName}</strong>
                    </p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                      <span className="bg-slate-100 py-0.2 px-1.5 rounded font-bold font-mono text-[9px]">{invite.date}</span>
                      <span>às {invite.time}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-1.5 items-center shrink-0 self-center">
                    <button
                      id={`btn-accept-meeting-${invite.id}`}
                      onClick={() => onUpdateMeetingStatus(invite.id, 'ACEITO')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> Aceitar
                    </button>
                    <button
                      id={`btn-decline-meeting-${invite.id}`}
                      onClick={() => onUpdateMeetingStatus(invite.id, 'RECUSADO')}
                      className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 font-bold text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Controls and Header ribbon */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Navigation Month/Week display */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 p-2.5 rounded-xl border border-blue-200">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">
              Calendário de Atividades
            </span>
            <h2 className="text-base font-black text-slate-900 leading-none capitalize">
              {viewType === 'MONTH' ? `${monthName} de ${year}` : `Semana de ${pivotDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`}
            </h2>
          </div>
        </div>

        {/* Filters and buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          <div className="flex rounded-lg bg-slate-100 p-1 font-bold text-[10px] uppercase tracking-wide border border-slate-200 shrink-0">
            <button
              onClick={() => setViewType('MONTH')}
              className={`py-1 px-3 rounded-md transition ${viewType === 'MONTH' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewType('WEEK')}
              className={`py-1 px-3 rounded-md transition ${viewType === 'WEEK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Semanal
            </button>
          </div>

          <div className="flex items-center gap-1 border rounded-lg bg-slate-50 p-1 border-slate-250">
            <button 
              id="btn-prev-pivot"
              onClick={handlePrevPivot} 
              className="p-1 hover:bg-white rounded transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={handleGoToToday}
              className="px-2.5 py-0.5 text-[10px] font-bold text-slate-650 hover:bg-white rounded transition cursor-pointer"
            >
              Hoje
            </button>
            <button 
              id="btn-next-pivot"
              onClick={handleNextPivot} 
              className="p-1 hover:bg-white rounded transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          <button
            id="btn-show-schedule-modal"
            onClick={() => setShowFormModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 shadow-xs transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Marcar Reunião Compartilhada
          </button>

        </div>
      </div>

      {/* 3. Main calendar structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* The Grid / Weeks row */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          
          {/* Weekday names strip */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 font-bold text-[10px] text-slate-500 uppercase tracking-wider font-mono">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Calendar boxes render */}
          <div className={`grid grid-cols-7 divide-x divide-y divide-slate-150 bg-slate-50 border-collapse`}>
            {viewType === 'MONTH' ? (
              monthDaysArray.map((date, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                const isCurrentMonth = date.getMonth() === month;
                const isSelected = dateStr === selectedDayString;
                const { deadlines, meetings: dayMeets } = getEventsForDay(dateStr);
                
                // Indicators check
                const hasDeadlines = deadlines.length > 0;
                const hasMeetings = dayMeets.length > 0;
                const totalEventsCount = deadlines.length + dayMeets.length;
                
                return (
                  <button
                    key={idx}
                    id={`day-cell-${dateStr}`}
                    onClick={() => setSelectedDayString(dateStr)}
                    className={`min-h-[85px] p-1.5 flex flex-col justify-between text-left transition-colors relative cursor-pointer focus:outline-none ${
                      isCurrentMonth ? 'bg-white' : 'bg-slate-55/60 text-slate-400'
                    } ${isSelected ? 'bg-blue-50/20 ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-50/40'}`}
                  >
                    {/* Day number */}
                    <div className="flex justify-between items-center text-xs font-black font-mono">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        date.toDateString() === new Date().toDateString() 
                          ? 'bg-blue-600 text-white font-extrabold' 
                          : isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {date.getDate()}
                      </span>

                      {/* Pill total alert count */}
                      {totalEventsCount > 0 && (
                        <span className="text-[8px] bg-indigo-50 text-indigo-700 py-0.2 px-1 border border-indigo-200 rounded">
                          {totalEventsCount}
                        </span>
                      )}
                    </div>

                    {/* Events Mini Pills (Scroll inside cell) */}
                    <div className="space-y-1 block max-h-[50px] overflow-hidden w-full mt-1 select-none">
                      
                      {/* Deadlines mini render */}
                      {deadlines.slice(0, 2).map((item) => (
                        <div 
                          key={item.id} 
                          className={`text-[8.5px] font-bold px-1 py-0.2 rounded border truncate block ${
                            item.priority === 'ALTA' 
                              ? 'bg-rose-50 text-rose-700 border-rose-150' 
                              : 'bg-amber-50 text-amber-700 border-amber-150'
                          }`}
                        >
                          ⏰ Prazo: {item.id}
                        </div>
                      ))}

                      {/* Meetings mini render */}
                      {dayMeets.slice(0, 2).map((meet) => (
                        <div 
                          key={meet.id} 
                          className={`text-[8.5px] font-extrabold px-1 py-0.2 rounded border truncate block ${
                            meet.status === 'PENDENTE'
                              ? 'bg-amber-50 text-amber-900 border-dashed border-amber-300'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-150'
                          }`}
                        >
                          👥 {meet.title}
                        </div>
                      ))}

                    </div>
                  </button>
                );
              })
            ) : (
              weekDaysArray.map((date, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = dateStr === selectedDayString;
                const { deadlines, meetings: dayMeets } = getEventsForDay(dateStr);
                const totalEventsCount = deadlines.length + dayMeets.length;

                return (
                  <button
                    key={idx}
                    id={`week-day-cell-${dateStr}`}
                    onClick={() => setSelectedDayString(dateStr)}
                    className={`min-h-[160px] p-2 bg-white flex flex-col justify-between text-left transition-colors relative cursor-pointer ${
                      isSelected ? 'bg-blue-50/25 ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-50/30'
                    }`}
                  >
                    {/* Weekday date text */}
                    <div className="flex justify-between items-center text-xs font-black font-mono">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        date.toDateString() === new Date().toDateString() 
                          ? 'bg-blue-600 text-white font-black' 
                          : 'text-slate-800 font-extrabold'
                      }`}>
                        {date.getDate()}
                      </span>
                      {totalEventsCount > 0 && (
                        <span className="text-[8px] bg-indigo-100 text-indigo-900 px-1 py-0.2 rounded">
                          {totalEventsCount}
                        </span>
                      )}
                    </div>

                    {/* Middle details column */}
                    <div className="flex-1 mt-2 space-y-1 overflow-y-auto block select-none">
                      {deadlines.map((item) => (
                        <div key={item.id} className="text-[8px] font-black p-1 rounded bg-rose-50 border border-rose-100 text-rose-800 leading-tight">
                          ⚠️ [POP] {item.title}
                        </div>
                      ))}

                      {dayMeets.map((meet) => (
                        <div key={meet.id} className={`text-[8px] font-black p-1 rounded border leading-tight ${
                          meet.status === 'PENDENTE' ? 'bg-amber-50 text-amber-900 border-dashed border-amber-300' : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                        }`}>
                          🤝 {meet.title} ({meet.time})
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* Right side Detailed Daily Feed */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Eventos do Dia Selecionado
              </span>
              <span className="text-[11px] font-bold text-slate-800 bg-slate-100 py-0.5 px-2 rounded-full font-mono">
                {selectedDayString}
              </span>
            </div>

            {selectedDayEvents.deadlines.length === 0 && selectedDayEvents.meetings.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-slate-400">
                <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 pointer-events-none" />
                <p className="text-xs font-semibold leading-relaxed">Nenhuma atividade agendada ou prazo final mapeado nesta data.</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Deadlines Section */}
                {selectedDayEvents.deadlines.length > 0 && (
                  <div className="space-y-2 text-xs">
                    <span className="text-[9.5px] font-extrabold uppercase text-rose-500 tracking-wider font-mono flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Prazos Finais de SLA ({selectedDayEvents.deadlines.length})
                    </span>

                    <div className="space-y-2">
                      {selectedDayEvents.deadlines.map((item) => (
                        <div key={item.id} className="p-3 bg-red-50/20 border border-rose-100 rounded-lg space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded uppercase">
                              {item.id}
                            </span>
                            <span className="bg-rose-100 text-rose-900 text-[8px] font-extrabold px-1.5 py-0.2 rounded">
                              {item.priority}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-slate-900 text-xs leading-snug">{item.title}</h5>
                          <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meetings Section */}
                {selectedDayEvents.meetings.length > 0 && (
                  <div className="space-y-2 text-xs">
                    <span className="text-[9.5px] font-extrabold uppercase text-indigo-500 tracking-wider font-mono flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-500" /> Reuniões Compartilhadas ({selectedDayEvents.meetings.length})
                    </span>

                    <div className="space-y-2">
                      {selectedDayEvents.meetings.map((meet) => (
                        <div key={meet.id} className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-lg space-y-2 font-medium">
                          <div className="flex items-center justify-between">
                            <span className="text-[10.5px] font-bold text-slate-800 flex items-center gap-1 truncate">
                              <Video className="w-3.5 h-3.5 text-indigo-600" />
                              {meet.title}
                            </span>
                            <span className={`text-[8.5px] font-extrabold py-0.5 px-2.5 rounded-full border ${
                              meet.status === 'ACEITO' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold' 
                                : 'bg-amber-50 text-amber-700 border-amber-100 font-mono'
                            }`}>
                              {meet.status === 'ACEITO' ? 'Confirmada' : 'Aguardando Aceite'}
                            </span>
                          </div>

                          <p className="text-[10.5px] text-slate-500 leading-snug">{meet.description}</p>

                          <div className="text-[10px] text-slate-450 border-t border-slate-100 pt-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span>Horário sugerido:</span>
                              <strong className="text-slate-800 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {meet.time}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Organizado por:</span>
                              <strong className="text-slate-700">{meet.hostName}</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Convidado:</span>
                              <strong className="text-slate-700">{meet.guestName}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>

      </div>

      {/* 4. Shared Meeting creation form MODAL wrapper */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Marcar Reunião Compartilhada
                </span>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="text-slate-400 hover:text-slate-655 cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateMeeting} className="space-y-4 text-xs">
                
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase text-[9.5px]">Título do Encontro *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alinhamento Geral de Metas e POP Compras..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase text-[9.5px]">Pauta / Descrição *</label>
                  <textarea
                    rows={3}
                    placeholder="Descreva as pautas, links de chamadas virtuais ou sala física corporativa..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 uppercase text-[9.5px]">Data *</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 uppercase text-[9.5px]">Horário *</label>
                    <input
                      type="time"
                      required
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Invite guest */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase text-[9.5px]">Convidar Colaborador ou Gestor *</label>
                  <select
                    value={invitedUserId}
                    onChange={(e) => setInvitedUserId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Selecione quem irá participar...</option>
                    {users.filter(u => u.id !== currentUser.id).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-450 block italic">
                    Ao convidar, uma solicitação aparecerá no calendário deles para o devido aceite.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t text-xs">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg flex items-center gap-1.5 shadow transform hover:scale-102 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Confirmar e Enviar Convite
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
