/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, UserRole } from '../types';
import { Shield, Briefcase, Eye, User as UserIcon, CheckSquare, Settings, LogOut } from 'lucide-react';

interface RoleSwitcherProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  users: User[];
  onLogout?: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentUser, onUserChange, users, onLogout }) => {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'GESTOR':
        return <Settings className="w-4 h-4 text-purple-500" />;
      case 'ANALISTA':
        return <CheckSquare className="w-4 h-4 text-blue-500" />;
      case 'SOLICITANTE':
        return <UserIcon className="w-4 h-4 text-green-500" />;
      case 'APROVADOR':
        return <Briefcase className="w-4 h-4 text-amber-500" />;
      case 'OBSERVADOR':
        return <Eye className="w-4 h-4 text-slate-500" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'GESTOR':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ANALISTA':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SOLICITANTE':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'APROVADOR':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'OBSERVADOR':
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'Controle total do sistema, configurações de automações globais, SLAs e auditoria geral.';
      case 'GESTOR':
        return 'Delega e aprova tarefas, gerencia equipe, transfere demandas, imputa feedbacks de produtividade obrigatórios.';
      case 'ANALISTA':
        return 'Executa as demandas destinadas à sua área, anexa evidências comprobatórias obrigatórias, inicia e conclui SLAs.';
      case 'SOLICITANTE':
        return 'Abre demandas (compras, reembolso, contratos), acompanha o funil, anexa propostas e interage com comentários.';
      case 'APROVADOR':
        return 'Valida tomadas de decisão e compras de alto valor (>10k) desencadeadas por regras de automação.';
      case 'OBSERVADOR':
        return 'Supervisiona a execução das demandas anexadas em sua radar de observação, sem interferir no fluxo operacional direto.';
    }
  };

  return (
    <div id="role-switcher-container" className="bg-slate-900 text-white border-b border-slate-800 py-3.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-md border border-blue-500/20">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-slate-200 flex items-center gap-2 font-display">
              FLOWTA <span className="text-[10px] bg-blue-500/10 text-blue-400 font-mono py-0.5 px-1.5 rounded uppercase border border-blue-500/20">Governança Operacional</span>
            </h1>
            <p className="text-xs text-slate-400 leading-tight">Painel corporativo de controle e auditoria operacional.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Current loggined user info */}
          <div className="flex items-center gap-2.5 bg-slate-950/60 p-1.5 pl-2.5 pr-4 rounded-xl border border-slate-800">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-6.5 h-6.5 rounded-full border border-slate-805 object-cover shrink-0" />
            <div className="text-left shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 leading-none">{currentUser.name.split(' ')[0]}</span>
                <span className={`text-[8.5px] font-black font-mono tracking-wider px-1.5 py-0.5 rounded border uppercase shrink-0 ${getRoleBadgeColor(currentUser.role)} bg-opacity-10 leading-none`}>
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-none mt-1">{currentUser.email}</p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Fazer logout da aplicação"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sair</span>
            </button>
          )}
        </div>

      </div>

      {/* Role explanation bar */}
      <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed md:items-center">
        <span className={`inline-flex items-center gap-1 border rounded py-0.5 px-2 text-[10px] font-mono tracking-wider font-semibold uppercase ${getRoleBadgeColor(currentUser.role)}`}>
          {getRoleIcon(currentUser.role)} {currentUser.role}
        </span>
        <p className="flex-1">
          <strong>Permissões de {currentUser.name}:</strong> {getRoleDescription(currentUser.role)}
        </p>
      </div>

    </div>
  );
};
