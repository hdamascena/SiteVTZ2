import React, { useState } from 'react';
import {
  QrCode,
  Trophy,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Medal,
  HeartHandshake,
} from 'lucide-react';
import { DEFAULT_SITE_SETTINGS } from '../data/clubeData.ts';
import type {
  SiteSettings,
  MatchResultRecord,
  ClubTrophyRecord,
  VolunteerApplicationRecord,
} from '../types/index.ts';

interface AdminCommunityModulesProps {
  draftSettings: SiteSettings;
  onUpdateDraftSettings: (updated: SiteSettings) => void;
  onSaveSettingsImmediately: (updated: SiteSettings, logMsg: string, toastMsg: string) => void;
  onNotify: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminCommunityModules: React.FC<AdminCommunityModulesProps> = ({
  draftSettings,
  onUpdateDraftSettings,
  onSaveSettingsImmediately,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<'pix' | 'resultados' | 'voluntarios'>('pix');

  const pixConfig = draftSettings.pixConfig || DEFAULT_SITE_SETTINGS.pixConfig!;
  const pledges = draftSettings.donationPledges || [];
  const matches = draftSettings.matchResults || DEFAULT_SITE_SETTINGS.matchResults || [];
  const trophies = draftSettings.clubTrophies || DEFAULT_SITE_SETTINGS.clubTrophies || [];
  const volunteers = draftSettings.volunteers || DEFAULT_SITE_SETTINGS.volunteers || [];

  // New Match Form State
  const [newMatchComp, setNewMatchComp] = useState('Copa Cariacica de Base 2026');
  const [newMatchCat, setNewMatchCat] = useState('Sub-15');
  const [newMatchDate, setNewMatchDate] = useState('22/11/2026');
  const [newMatchLoc, setNewMatchLoc] = useState('Quadra Poliesportiva Rio Marinho');
  const [newMatchHome, setNewMatchHome] = useState('A.E. Vitalizar');
  const [newMatchAway, setNewMatchAway] = useState('');
  const [newMatchHomeScore, setNewMatchHomeScore] = useState(0);
  const [newMatchAwayScore, setNewMatchAwayScore] = useState(0);
  const [newMatchStatus, setNewMatchStatus] = useState<'encerrado' | 'agendado'>('encerrado');
  const [newMatchMvp, setNewMatchMvp] = useState('');

  // New Trophy Form State
  const [newTrophyTitle, setNewTrophyTitle] = useState('');
  const [newTrophyComp, setNewTrophyComp] = useState('');
  const [newTrophyYear, setNewTrophyYear] = useState('2026');
  const [newTrophyCat, setNewTrophyCat] = useState('Sub-15');
  const [newTrophyPlace, setNewTrophyPlace] =
    useState<ClubTrophyRecord['placement']>('1º Lugar - Campeão');
  const [newTrophyDesc, setNewTrophyDesc] = useState('');

  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchAway.trim()) {
      onNotify('Informe o nome da equipe adversária.', 'error');
      return;
    }
    const created: MatchResultRecord = {
      id: `match-${Date.now()}`,
      competition: newMatchComp.trim(),
      category: newMatchCat,
      date: newMatchDate.trim(),
      location: newMatchLoc.trim(),
      homeTeam: newMatchHome.trim() || 'A.E. Vitalizar',
      awayTeam: newMatchAway.trim(),
      homeScore: Number(newMatchHomeScore) || 0,
      awayScore: Number(newMatchAwayScore) || 0,
      status: newMatchStatus,
      mvpPlayerName: newMatchMvp.trim() || undefined,
    };
    const nextSettings: SiteSettings = {
      ...draftSettings,
      matchResults: [created, ...matches],
    };
    onUpdateDraftSettings(nextSettings);
    onSaveSettingsImmediately(
      nextSettings,
      `Partida "${created.homeTeam} vs ${created.awayTeam}" (${created.category}) adicionada.`,
      'Resultado / jogo adicionado com sucesso!'
    );
    setNewMatchAway('');
    setNewMatchMvp('');
  };

  const handleDeleteMatch = (id: string) => {
    const nextSettings: SiteSettings = {
      ...draftSettings,
      matchResults: matches.filter((m) => m.id !== id),
    };
    onUpdateDraftSettings(nextSettings);
    onSaveSettingsImmediately(nextSettings, 'Jogo removido do mural.', 'Jogo removido.');
  };

  const handleAddTrophy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrophyTitle.trim()) return;
    const created: ClubTrophyRecord = {
      id: `trophy-${Date.now()}`,
      title: newTrophyTitle.trim(),
      competition: newTrophyComp.trim() || 'Torneio Municipal de Cariacica',
      year: newTrophyYear.trim() || '2026',
      category: newTrophyCat.trim() || 'Base',
      placement: newTrophyPlace,
      description: newTrophyDesc.trim(),
    };
    const nextSettings: SiteSettings = {
      ...draftSettings,
      clubTrophies: [created, ...trophies],
    };
    onUpdateDraftSettings(nextSettings);
    onSaveSettingsImmediately(
      nextSettings,
      `Troféu "${created.title}" adicionado à galeria de conquistas.`,
      'Conquista adicionada à Sala de Troféus!'
    );
    setNewTrophyTitle('');
    setNewTrophyComp('');
    setNewTrophyDesc('');
  };

  const handleDeleteTrophy = (id: string) => {
    const nextSettings: SiteSettings = {
      ...draftSettings,
      clubTrophies: trophies.filter((t) => t.id !== id),
    };
    onUpdateDraftSettings(nextSettings);
    onSaveSettingsImmediately(nextSettings, 'Troféu removido.', 'Troféu removido.');
  };

  const handleToggleVolunteerStatus = (id: string, status: VolunteerApplicationRecord['status']) => {
    const nextSettings: SiteSettings = {
      ...draftSettings,
      volunteers: volunteers.map((v) => (v.id === id ? { ...v, status } : v)),
    };
    onUpdateDraftSettings(nextSettings);
    onSaveSettingsImmediately(
      nextSettings,
      `Status do voluntário atualizado para ${status}.`,
      'Status do voluntário atualizado!'
    );
  };

  const handleDeleteVolunteer = (id: string) => {
    const nextSettings: SiteSettings = {
      ...draftSettings,
      volunteers: volunteers.filter((v) => v.id !== id),
    };
    onUpdateDraftSettings(nextSettings);
    onSaveSettingsImmediately(
      nextSettings,
      'Cadastro de voluntário removido.',
      'Voluntário removido.'
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">
              Novos Módulos Comunitários & Captação
            </span>
            <h2 className="text-xl font-black text-[#0a1e36] uppercase mt-0.5">
              Gestão de PIX (CNPJ), Placares da Base, Troféus e Voluntariado
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Configure a chave PIX oficial da Associação Vitalizar (padrão CNPJ{' '}
              <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                63.083.068/0001-00
              </code>
              ), atualize placares de jogos e aprove voluntários.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onSaveSettingsImmediately(
                draftSettings,
                'Configurações de PIX, Jogos e Voluntariado salvas.',
                'Alterações salvas com sucesso!'
              )
            }
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Módulos</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSubTab('pix')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              subTab === 'pix'
                ? 'bg-[#0a1e36] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Doações & Chave PIX ({pledges.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('resultados')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              subTab === 'resultados'
                ? 'bg-[#0a1e36] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Jogos & Troféus ({matches.length + trophies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('voluntarios')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              subTab === 'voluntarios'
                ? 'bg-[#0a1e36] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Voluntários ({volunteers.length})</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUBTAB 1: CHAVE PIX OFICIAL & DOAÇÕES */}
      {/* ===================================================================== */}
      {subTab === 'pix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-[#0a1e36] uppercase">
              Configuração da Chave PIX Oficial (BRCode Banco Central)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Tipo de Chave PIX
                </label>
                <select
                  value={pixConfig.keyType}
                  onChange={(e) =>
                    onUpdateDraftSettings({
                      ...draftSettings,
                      pixConfig: {
                        ...pixConfig,
                        keyType: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="CNPJ">CNPJ (Padrão Institucional)</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="TELEFONE">Telefone Celular</option>
                  <option value="ALEATORIA">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Chave Exibida no Site (Formatada)
                </label>
                <input
                  type="text"
                  value={pixConfig.pixKeyFormatted}
                  onChange={(e) => {
                    const formatted = e.target.value;
                    const rawDigits =
                      pixConfig.keyType === 'CNPJ'
                        ? formatted.replace(/\D/g, '')
                        : formatted.trim();
                    onUpdateDraftSettings({
                      ...draftSettings,
                      pixConfig: {
                        ...pixConfig,
                        pixKeyFormatted: formatted,
                        pixKey: rawDigits || formatted,
                      },
                    });
                  }}
                  placeholder="63.083.068/0001-00"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nome do Favorecido (Até 25 caracteres)
                </label>
                <input
                  type="text"
                  value={pixConfig.beneficiaryName}
                  onChange={(e) =>
                    onUpdateDraftSettings({
                      ...draftSettings,
                      pixConfig: {
                        ...pixConfig,
                        beneficiaryName: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Cidade do Favorecido
                </label>
                <input
                  type="text"
                  value={pixConfig.city}
                  onChange={(e) =>
                    onUpdateDraftSettings({
                      ...draftSettings,
                      pixConfig: {
                        ...pixConfig,
                        city: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-[#0a1e36] uppercase">
              Intenções de Apoio & Protocolos PIX Registrados ({pledges.length})
            </h3>

            {pledges.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                Nenhum protocolo de doação registrado ainda.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {pledges.map((pl) => (
                  <div
                    key={pl.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {pl.donorName} ·{' '}
                        <strong className="text-emerald-700 font-mono">
                          R$ {pl.amount.toFixed(2)}
                        </strong>
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {pl.purpose} · {pl.date} · Protocolo {pl.protocol}
                      </span>
                      {pl.message && (
                        <p className="text-[11px] text-slate-600 italic mt-0.5">
                          "{pl.message}"
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {pl.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 2: JOGOS, RESULTADOS & SALA DE TROFÉUS */}
      {/* ===================================================================== */}
      {subTab === 'resultados' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Matches Management */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
            <h3 className="text-sm font-black text-[#0a1e36] uppercase">
              Cadastrar Jogo / Resultado das Categorias de Base
            </h3>

            <form onSubmit={handleAddMatch} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newMatchComp}
                  onChange={(e) => setNewMatchComp(e.target.value)}
                  placeholder="Competição / Torneio"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl sm:col-span-2"
                />
                <select
                  value={newMatchCat}
                  onChange={(e) => setNewMatchCat(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Sub-11">Sub-11</option>
                  <option value="Sub-13">Sub-13</option>
                  <option value="Sub-15">Sub-15</option>
                  <option value="Sub-17">Sub-17</option>
                  <option value="Festival">Festival Comunitário</option>
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={newMatchHome}
                  onChange={(e) => setNewMatchHome(e.target.value)}
                  placeholder="Mandante (Vitalizar)"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="number"
                  min="0"
                  value={newMatchHomeScore}
                  onChange={(e) => setNewMatchHomeScore(Number(e.target.value))}
                  placeholder="Gols Casa"
                  className="px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="number"
                  min="0"
                  value={newMatchAwayScore}
                  onChange={(e) => setNewMatchAwayScore(Number(e.target.value))}
                  placeholder="Gols Visitante"
                  className="px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  value={newMatchAway}
                  onChange={(e) => setNewMatchAway(e.target.value)}
                  placeholder="Equipe Adversária *"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newMatchDate}
                  onChange={(e) => setNewMatchDate(e.target.value)}
                  placeholder="Data (ex: 22/11/2026)"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <select
                  value={newMatchStatus}
                  onChange={(e) => setNewMatchStatus(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="encerrado">Jogo Encerrado</option>
                  <option value="agendado">Próximo Jogo Agendado</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Jogo</span>
                </button>
              </div>
            </form>

            <div className="space-y-2 pt-3 border-t border-slate-100 max-h-72 overflow-y-auto">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">
                      [{m.category}] {m.homeTeam} {m.homeScore} × {m.awayScore} {m.awayTeam}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {m.competition} · {m.date} ({m.status})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMatch(m.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Trophies Management */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
            <h3 className="text-sm font-black text-[#0a1e36] uppercase">
              Sala de Troféus & Conquistas ({trophies.length})
            </h3>

            <form onSubmit={handleAddTrophy} className="space-y-3">
              <input
                type="text"
                value={newTrophyTitle}
                onChange={(e) => setNewTrophyTitle(e.target.value)}
                placeholder="Título da Conquista (ex: Campeão Copa Sub-15)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={newTrophyYear}
                  onChange={(e) => setNewTrophyYear(e.target.value)}
                  placeholder="Ano (2026)"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  value={newTrophyCat}
                  onChange={(e) => setNewTrophyCat(e.target.value)}
                  placeholder="Categoria (Sub-15)"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <input
                type="text"
                value={newTrophyDesc}
                onChange={(e) => setNewTrophyDesc(e.target.value)}
                placeholder="Resumo da campanha / premiação..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                type="submit"
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Medal className="w-4 h-4" />
                <span>Adicionar Troféu / Conquista</span>
              </button>
            </form>

            <div className="space-y-2 pt-3 border-t border-slate-100 max-h-60 overflow-y-auto">
              {trophies.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {t.title} ({t.year})
                    </span>
                    <span className="text-[11px] text-amber-700 font-semibold">
                      {t.placement} · {t.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteTrophy(t.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 3: VOLUNTÁRIOS CADASTRADOS */}
      {/* ===================================================================== */}
      {subTab === 'voluntarios' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-black text-[#0a1e36] uppercase">
            Banco de Voluntários e Parceiros Técnicos ({volunteers.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {volunteers.map((v) => (
              <div
                key={v.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-500">
                      {v.protocol} · {v.createdAt}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        v.status === 'ativo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{v.name}</h4>
                  <p className="text-[#0284c7] font-semibold">
                    {v.area} · {v.availability}
                  </p>
                  <p className="text-slate-600">{v.experience}</p>
                  {v.motivation && (
                    <p className="text-slate-500 italic">"{v.motivation}"</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleVolunteerStatus(
                          v.id,
                          v.status === 'ativo' ? 'em_analise' : 'ativo'
                        )
                      }
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>
                        {v.status === 'ativo' ? 'Marcar Em Análise' : 'Aprovar / Ativar'}
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteVolunteer(v.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Remover voluntário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
