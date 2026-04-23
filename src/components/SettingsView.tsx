
import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, Lock, Save, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface SettingsViewProps {
  currentUser: User;
  onUpdatePassword: (password: string) => Promise<boolean>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onUpdatePassword }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password === confirmPassword) {
      if (await onUpdatePassword(password)) {
        setSuccess(true);
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccess(false), 3000);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <div className="p-4 bg-indigo-50 rounded-3xl text-indigo-600">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight">Configurações de Acesso</h1>
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Gerencie sua senha e assinatura digital</p>
        </div>
      </header>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Nova Senha / Assinatura</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                className="w-full p-4 pl-12 pr-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Lock className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"}
                className="w-full p-4 pl-12 pr-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <Lock className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-700 text-[12px] font-bold uppercase rounded-xl border border-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Senha atualizada com sucesso!
            </div>
          )}

          <button 
            type="submit"
            disabled={!password || password !== confirmPassword}
            className="w-full py-4 bg-indigo-600 disabled:bg-slate-200 text-white rounded-2xl font-bold uppercase text-[12px] tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Atualizar Credenciais
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsView;
