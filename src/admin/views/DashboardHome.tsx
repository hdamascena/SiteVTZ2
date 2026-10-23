import React from 'react';
import {
  FileCheck2,
  MessageSquare,
  Crosshair,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react';
import type { AdminSectionId, AdminUserProfile } from '../types.ts';
import { ROLE_LABELS } from '../permissions.ts';
import { useClubData } from '../../context/ClubDataContext.tsx';

interface DashboardHomeProps {
  profile: AdminUserProfile;
  onNavigate: (section: AdminSectionId, queryParams?: Record<string, string>) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  profile,
  onNavigate,
}) => {
  const {
    projects,
    rsvps,
    contactMessages,
    scoutInquiries,
    newsArticles,
    events,
    transparencyDocs,
    siteSettings,
  } = useClubData();

  const role = profile.role;
  const donationPledges = siteSettings.donationPledges || [];
  const unreadMessages = contactMessages.filter((m) => !m.read);
  const pendingEnrollments = rsvps.filter(
    (r) => (r.enrollmentStatus || 'pendente') === 'pendente'
  );
  const newScoutInquiries = scoutInquiries.filter((s) => s.status === 'nova');
  const draftNews = newsArticles.filter((n) => n.status === 'rascunho');

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-[#0284c7] dark:text-sky-400">
              {ROLE_LABELS[role]}
            </span>
            <span aria-hidden="true">·</span>
            <span>{profile.email}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Olá, {profile.nome}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(role === 'admin' || role === 'super_admin') && (
            <button
              type="button"
              onClick={() => onNavigate('inscricoes')}
              className="px-3.5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Interesses & Inscrições ({pendingEnrollments.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. PAINEL DO ADMIN / SUPER_ADMIN */}
      {(role === 'admin' || role === 'super_admin') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Interesses Pendentes</span>
                <FileCheck2 className="w-4 h-4 text-[#0284c7]" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                {pendingEnrollments.length}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('inscricoes', { status: 'pendente' })}
                className="text-[11px] font-semibold text-[#0284c7] dark:text-sky-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Gerenciar solicitações</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Mensagens Não Lidas</span>
                <MessageSquare className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                {unreadMessages.length}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('comunidade', { tab: 'mensagens' })}
                className="text-[11px] font-semibold text-[#0284c7] dark:text-sky-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Abrir caixa de entrada</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Contatos de Olheiros / Clubes</span>
                <Crosshair className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                {newScoutInquiries.length}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('comunidade', { tab: 'olheiros' })}
                className="text-[11px] font-semibold text-[#0284c7] dark:text-sky-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Ver solicitações técnicas</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Apoiadores / Doações PIX</span>
                <HeartHandshake className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                {donationPledges.length}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('comunidade', { tab: 'doacoes' })}
                className="text-[11px] font-semibold text-[#0284c7] dark:text-sky-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Conferir doações PIX</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Últimos Interesses em Projetos e Eventos
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('inscricoes')}
                  className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Ver todos →
                </button>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {rsvps.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                        {r.studentName || r.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {r.eventTitle} · {r.date}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 shrink-0">
                      {r.enrollmentStatus || 'pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Pendências de Mensagens e Olheiros
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('comunidade')}
                  className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Abrir atendimento →
                </button>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {unreadMessages.slice(0, 3).map((m) => (
                  <div key={m.id} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {m.name} · {m.subject}
                      </span>
                      <span className="text-[11px] text-amber-600 font-semibold">
                        Não lida
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {m.message}
                    </p>
                  </div>
                ))}
                {newScoutInquiries.slice(0, 2).map((s) => (
                  <div key={s.id} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Olheiro: {s.scoutName} ({s.organization})
                      </span>
                      <span className="text-[11px] text-emerald-600 font-mono">
                        {s.protocol}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Interesse: {s.targetPlayerName || s.targetCategory}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PAINEL DO EDITOR */}
      {role === 'editor' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Notícias Publicadas / Rascunhos</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {newsArticles.length} ({draftNews.length} rascunhos)
            </div>
            <button
              type="button"
              onClick={() => onNavigate('noticias')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Editar notícias</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Agenda de Eventos</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {events.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('eventos')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Gerenciar agenda</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Projetos & Atletas na Vitrine</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {projects.length} projetos
            </div>
            <button
              type="button"
              onClick={() => onNavigate('participantes')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Gerenciar atletas da vitrine</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 3. PAINEL DO FINANCEIRO */}
      {role === 'financeiro' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Registros de Doação PIX</span>
            <div className="text-2xl font-extrabold text-emerald-600 font-mono tabular-nums mt-1">
              {donationPledges.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('comunidade', { tab: 'doacoes' })}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Conferir doações PIX</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Documentos de Transparência</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {transparencyDocs.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('transparencia')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Conferir prestação de contas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Chave PIX Oficial</span>
            <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {siteSettings.pixConfig?.pixKeyFormatted || '63.083.068/0001-00'}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('configuracoes')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Conferir configuração PIX</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 4. PAINEL DO PARCEIRO */}
      {role === 'parceiro' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Projetos Apoiados na Rede</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {projects.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('patrocinadores')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Gerenciar perfil de parceiro</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Relatórios de Transparência</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {transparencyDocs.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('transparencia')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Consultar certidões e balancetes</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Avaliações & Captação Técnica</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {scoutInquiries.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('comunidade', { tab: 'olheiros' })}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Acompanhar solicitações</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
