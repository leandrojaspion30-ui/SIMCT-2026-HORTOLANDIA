
import React, { useMemo } from 'react';
import { Bell, Calendar, Clock, MapPin, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { AgendaEntry } from '../types';

interface AppointmentAlertProps {
  event: AgendaEntry;
  onView: (id: string) => void;
  onDismiss: (id: string) => void;
  isReminder?: boolean;
}

const AppointmentAlert: React.FC<AppointmentAlertProps> = ({ event, onView, onDismiss, isReminder }) => {
  const isImminent = useMemo(() => {
    const now = new Date();
    try {
      const eventDate = new Date(`${event.data}T${event.hora}:00`);
      const diffMs = eventDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours > 0 && diffHours <= 2;
    } catch (e) {
      return false;
    }
  }, [event]);

  return (
    <div className="fixed bottom-8 right-8 z-[100] w-full max-w-sm animate-in slide-in-from-right-10 duration-500">
      <div className={`bg-white rounded-2xl border-2 shadow-2xl overflow-hidden ${isImminent ? 'border-orange-500' : 'border-[#111827]'}`}>
        <div className={`p-4 flex items-center justify-between ${isImminent ? 'bg-orange-500 text-white' : 'bg-[#111827] text-white'}`}>
          <div className="flex items-center gap-2">
            <Bell className={`w-4 h-4 ${isImminent ? 'animate-bounce' : ''}`} />
            <span className="text-[11px] font-bold uppercase tracking-widest">
              {isImminent ? 'Lembrete Prioritário (2h)' : 'Compromisso Agendado'}
            </span>
          </div>
          <button 
            onClick={() => onDismiss(event.id)} 
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-[16px] font-bold text-[#111827] uppercase leading-tight">
              {event.descricao || 'Compromisso Sem Título'}
            </h4>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-[13px] text-[#4B5563] font-medium uppercase">
                <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                {new Date(event.data).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex items-center gap-2 text-[13px] text-[#4B5563] font-medium uppercase">
                <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                {event.hora}
              </div>
              {event.local && (
                <div className="flex items-center gap-2 text-[13px] text-[#4B5563] font-medium uppercase">
                  <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                  {event.local}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => onView(event.id)}
              className="flex-1 py-3 border border-[#E5E7EB] text-[#111827] rounded-xl text-[12px] font-bold uppercase hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-2"
            >
              Visualizar <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => onDismiss(event.id)}
              className={`flex-1 py-3 rounded-xl text-[12px] font-bold uppercase transition-all flex items-center justify-center gap-2 shadow-lg ${isImminent ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-[#111827] text-white hover:bg-[#2563EB]'}`}
            >
              Entendido <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentAlert;
