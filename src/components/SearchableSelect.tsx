import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  className,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const normalizeText = (text: string) => 
    (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const searchNorm = normalizeText(search);
    return options.filter(opt => normalizeText(opt).includes(searchNorm));
  }, [options, search]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelectOption = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative w-full" ref={containerRef} id={id}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`${className || ''} w-full text-left flex items-center justify-between cursor-pointer`}
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100 max-h-60 flex flex-col">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="PESQUISAR..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-[11px] font-bold uppercase text-slate-800 outline-none placeholder:text-slate-400"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1 cursor-pointer"
              >
                LIMPAR
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-[10px] font-bold uppercase text-slate-400 text-center">
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={(e) => {
                    // Previne perda de foco do input que causa descarte de cliques no primeiro toque
                    e.preventDefault();
                    handleSelectOption(opt);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleSelectOption(opt);
                  }}
                  onClick={() => {
                    handleSelectOption(opt);
                  }}
                  className={`w-full text-left p-3 text-[11px] font-bold uppercase hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer active:bg-blue-100 ${
                    value === opt ? 'bg-blue-50/50 text-blue-600' : 'text-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  {value === opt && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
