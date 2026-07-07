import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { REDE_HORTOLANDIA } from '../constants';

interface SearchableServiceSelectProps {
  value: string; // "AREA|SERVICO"
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  focusColorClass?: string; // e.g., 'focus:border-purple-500' or 'border-purple-500'
}

interface ServiceOption {
  value: string;
  label: string;
  area: string;
}

export const SearchableServiceSelect: React.FC<SearchableServiceSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "SELECIONAR ÁREA E SERVIÇO...",
  className = "",
  focusColorClass = "focus-within:border-purple-500"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  // Construct all options list
  const allOptions = useMemo(() => {
    const list: ServiceOption[] = [
      {
        value: 'OUTROS|OUTROS SERVIÇOS / FORA DA REDE',
        label: 'OUTROS SERVIÇOS / FORA DA REDE',
        area: 'OUTROS'
      }
    ];

    Object.entries(REDE_HORTOLANDIA).forEach(([area, services]) => {
      services.forEach(s => {
        list.push({
          value: `${area}|${s}`,
          label: s,
          area: area
        });
      });
    });

    return list;
  }, []);

  // Filter options based on search string
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return allOptions;
    const query = search.toLowerCase();
    return allOptions.filter(
      opt =>
        opt.label.toLowerCase().includes(query) ||
        opt.area.toLowerCase().includes(query)
    );
  }, [allOptions, search]);

  // Grouped filtered options to render with headers
  const groupedOptions = useMemo(() => {
    const groups: { [key: string]: ServiceOption[] } = {};
    filteredOptions.forEach(opt => {
      if (!groups[opt.area]) {
        groups[opt.area] = [];
      }
      groups[opt.area].push(opt);
    });
    return groups;
  }, [filteredOptions]);

  // Find the selected option's label to show on the button
  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const found = allOptions.find(opt => opt.value === value);
    return found ? `${found.area} - ${found.label}` : value;
  }, [value, allOptions]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left flex items-center justify-between cursor-pointer outline-none transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'
        } ${className}`}
      >
        <span className={`truncate ${value ? "text-slate-800" : "text-slate-400"}`}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-80 flex flex-col">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="DIGITE PARA BUSCAR..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-[11px] font-black uppercase text-slate-800 outline-none placeholder:text-slate-400"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1 shrink-0"
              >
                LIMPAR
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="overflow-y-auto flex-1 max-h-60 scrollbar-thin">
            {Object.keys(groupedOptions).length === 0 ? (
              <div className="p-4 text-[10px] font-black uppercase text-slate-400 text-center">
                Nenhum serviço encontrado
              </div>
            ) : (
              Object.entries(groupedOptions).map(([area, opts]) => (
                <div key={area} className="border-b border-slate-50 last:border-b-0 pb-1">
                  {/* Area Group Header */}
                  <div className="px-3 pt-2 pb-1 text-[9px] font-black tracking-widest text-slate-400 uppercase bg-slate-50/40">
                    {area}
                  </div>
                  {/* Area Options */}
                  <div className="space-y-0.5">
                    {opts.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase hover:bg-slate-100/70 transition-colors flex items-center justify-between ${
                          value === opt.value ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate pr-4">{opt.label}</span>
                        {value === opt.value && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
