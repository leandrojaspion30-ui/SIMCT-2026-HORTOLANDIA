
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { ShieldCheck, Lock, Save, CheckCircle2, Eye, EyeOff, Camera, Trash2, User as UserIcon, Upload } from 'lucide-react';

interface SettingsViewProps {
  currentUser: User;
  onUpdatePassword: (password: string) => Promise<boolean>;
  onUpdatePhoto?: (fotoUrl: string) => Promise<boolean>;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 300;
        if (width > height) {
          if (width > max) {
            height = Math.round((height * max) / width);
            width = max;
          }
        } else {
          if (height > max) {
            width = Math.round((width * max) / height);
            height = max;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onUpdatePassword, onUpdatePhoto }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressedDataUrl = await compressImage(file);
      if (onUpdatePhoto) {
        await onUpdatePhoto(compressedDataUrl);
        setPhotoSuccess(true);
        setTimeout(() => setPhotoSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Erro ao processar foto:', err);
      alert('Não foi possível carregar a imagem. Tente uma imagem menor.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (window.confirm('Deseja remover sua foto de perfil?')) {
      if (onUpdatePhoto) {
        await onUpdatePhoto('');
        setPhotoSuccess(true);
        setTimeout(() => setPhotoSuccess(false), 3000);
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
          <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight">Configurações de Acesso & Perfil</h1>
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Gerencie sua foto de perfil, senha e credenciais</p>
        </div>
      </header>

      {/* CARD DA FOTO DE PERFIL */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group shrink-0">
          {currentUser.fotoUrl ? (
            <img 
              src={currentUser.fotoUrl} 
              alt={currentUser.nome} 
              className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-indigo-50 text-indigo-600 border-4 border-indigo-100 shadow-md flex items-center justify-center font-black text-3xl">
              {currentUser.nome ? currentUser.nome.charAt(0).toUpperCase() : <UserIcon className="w-10 h-10" />}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Alterar Foto de Perfil"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <h3 className="text-lg font-black text-slate-800 uppercase">{currentUser.nome}</h3>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{currentUser.cargo} • Unidade {currentUser.unidade_id || 1}</p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            onChange={handlePhotoSelect} 
            className="hidden" 
          />

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {isUploadingPhoto ? 'Carregando...' : 'Carregar Nova Foto'}
            </button>

            {currentUser.fotoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remover Foto
              </button>
            )}
          </div>

          {photoSuccess && (
            <p className="text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Foto de perfil atualizada!
            </p>
          )}
        </div>
      </div>

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
