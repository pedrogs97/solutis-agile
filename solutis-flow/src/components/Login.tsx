/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, UserRole } from '../types';
import { Shield, Key, Mail, Lock, AlertTriangle, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { useToast } from './Toast';

interface LoginProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  // Helper dictionary for localized role names
  const roleLabels: Record<UserRole, string> = {
    ADMIN: 'Administrador',
    GESTOR: 'Gestora Operacional',
    ANALISTA: 'Analista Financeiro',
    SOLICITANTE: 'Solicitador Integrado',
    APROVADOR: 'Diretoria Executiva',
    OBSERVADOR: 'Observador Técnico',
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-50 text-red-600 border-red-200';
      case 'GESTOR': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'ANALISTA': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'SOLICITANTE': return 'bg-green-50 text-green-600 border-green-200';
      case 'APROVADOR': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'OBSERVADOR': return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      const msg = 'Por favor, informe seu e-mail corporativo.';
      setError(msg);
      toastError(msg);
      return;
    }

    if (!password) {
      const msg = 'Por favor, informe sua senha institucional.';
      setError(msg);
      toastError(msg);
      return;
    }

    setLoading(true);

    // Simulate short, elegant network latency
    setTimeout(() => {
      const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

      if (!user) {
        const msg = 'E-mail não localizado. Utilize um dos e-mails cadastrados.';
        setError(msg);
        toastError(msg);
        setLoading(false);
        return;
      }

      if (password !== 'Teste@123') {
        const msg = 'Senha incorreta. Use a senha sugerida Teste@123.';
        setError(msg);
        toastError(msg);
        setLoading(false);
        return;
      }

      const welcomeMsg = `Sessão autorizada como ${user.name}!`;
      setSuccess(`Acesso concedido! Bem-vindo(a), ${user.name}.`);
      toastSuccess(welcomeMsg);
      
      setTimeout(() => {
        onLoginSuccess(user);
      }, 800);
    }, 600);
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans select-none selection:bg-indigo-500 selection:text-white">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      
      {/* Animated container wrapper */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 backdrop-blur-md relative z-10 p-6 sm:p-8 md:p-10 flex flex-col justify-between space-y-8"
      >
        
        {/* Top Logo and Tagline */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase">
              FLOWTA <span className="text-xs text-indigo-600 font-mono tracking-wider font-extrabold ml-1 border border-indigo-100 px-1.5 py-0.5 rounded">Gov</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase leading-none mt-1">Governança Operacional</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Login Institucional</h2>
            <p className="text-xs text-slate-500 mt-2">Acesse o sistema integrador com o seu perfil corporativo de governança.</p>
          </div>

          {/* Notifications Messages */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs shadow-xs"
            >
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-emerald-800 text-xs shadow-xs"
            >
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="font-semibold">{success}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 tracking-tight block">E-mail Corporativo</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  type="email"
                  placeholder="exemplo@flowta.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || !!success}
                  className="w-full text-sm py-2.5 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-155 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 tracking-tight block">Senha Institucional</label>
                <span className="text-[10px] text-slate-400 font-mono font-semibold">Padrão: Teste@123</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || !!success}
                  className="w-full text-sm py-2.5 pl-9 pr-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-155 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className={`w-full text-xs font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 tracking-wider uppercase transition-all duration-300 shadow-md ${
                success 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:shadow-indigo-200'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Autenticando...
                </span>
              ) : success ? (
                'Redirecionando...'
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prompt standard details */}
        <div className="pt-4 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p>
            Ambiente protegido com governança por papéis. Use um e-mail institucional cadastrado (como ana@flowta.com.br, pedro@flowta.com.br, etc.) com a senha corporativa correspondente.
          </p>
        </div>

      </motion.div>

    </div>
  );
};
