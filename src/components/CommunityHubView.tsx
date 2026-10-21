import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  HeartHandshake,
  Users,
  Copy,
  Check,
  Award,
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  QrCode,
  Send,
  Medal,
} from 'lucide-react';
import { useClubData } from '../context/ClubDataContext.tsx';
import { DEFAULT_SITE_SETTINGS } from '../data/clubeData.ts';
import {
  generatePixBrCode,
  generateDeterministicQrMatrix,
} from '../utils/pixPayload.ts';
import type {
  VolunteerApplicationRecord,
  DonationPledgeRecord,
} from '../types/index.ts';

export type CommunityHubTab =
  | 'resultados'
  | 'apoie-pix'
  | 'voluntariado';

interface CommunityHubViewProps {
  initialTab?: CommunityHubTab;
  mode?: 'full_page' | 'home_section';
  onOpenFullHub?: (tab: CommunityHubTab) => void;
}

export const CommunityHubView: React.FC<CommunityHubViewProps> = ({
  initialTab = 'resultados',
  mode = 'full_page',
  onOpenFullHub,
}) => {
  const {
    clubInfo,
    siteSettings,
    setSiteSettings,
    showToast,
    addAuditLog,
  } = useClubData();

  const [activeTab, setActiveTab] = useState<CommunityHubTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // ============================================================================
  // IDEA 3 STATE: JOGOS, RESULTADOS & GALERIA DE TROFÉUS DA BASE
  // ============================================================================
  const matchResults = useMemo(
    () =>
      siteSettings.matchResults && siteSettings.matchResults.length > 0
        ? siteSettings.matchResults
        : DEFAULT_SITE_SETTINGS.matchResults || [],
    [siteSettings.matchResults]
  );

  const clubTrophies = useMemo(
    () =>
      siteSettings.clubTrophies && siteSettings.clubTrophies.length > 0
        ? siteSettings.clubTrophies
        : DEFAULT_SITE_SETTINGS.clubTrophies || [],
    [siteSettings.clubTrophies]
  );

  const [matchCategoryFilter, setMatchCategoryFilter] = useState<string>('all');

  const filteredMatches = useMemo(() => {
    if (matchCategoryFilter === 'all') return matchResults;
    return matchResults.filter((m) => m.category === matchCategoryFilter);
  }, [matchResults, matchCategoryFilter]);

  // ============================================================================
  // IDEA 4 STATE: CENTRAL APOIE VIA PIX (CNPJ 63.083.068/0001-00)
  // ============================================================================
  const pixConfig = useMemo(
    () => siteSettings.pixConfig || DEFAULT_SITE_SETTINGS.pixConfig!,
    [siteSettings.pixConfig]
  );

  const [selectedPixAmount, setSelectedPixAmount] = useState<number>(65);
  const [customPixAmount, setCustomPixAmount] = useState<string>('');
  const [copiedPixCode, setCopiedPixCode] = useState<boolean>(false);
  const [copiedPixKey, setCopiedPixKey] = useState<boolean>(false);
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');
  const [pledgeProtocol, setPledgeProtocol] = useState<string | null>(null);

  const effectivePixAmount = useMemo(() => {
    const parsed = parseFloat(customPixAmount.replace(',', '.'));
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    return selectedPixAmount;
  }, [customPixAmount, selectedPixAmount]);

  const pixBrCode = useMemo(
    () =>
      generatePixBrCode({
        pixKey: pixConfig.pixKey || '63083068000100',
        beneficiaryName: pixConfig.beneficiaryName || 'ASSOC ESPORTIVA VITALIZAR',
        city: pixConfig.city || 'CARIACICA',
        amount: effectivePixAmount,
        txId: 'VITALIZAR2026',
      }),
    [pixConfig, effectivePixAmount]
  );

  const qrMatrix = useMemo(
    () => generateDeterministicQrMatrix(pixBrCode),
    [pixBrCode]
  );

  const handleCopyPixBrCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pixBrCode);
      setCopiedPixCode(true);
      showToast('Código PIX Copia e Cola copiado para a área de transferência!', 'success');
      setTimeout(() => setCopiedPixCode(false), 3000);
    }
  };

  const handleCopyPixKeyOnly = () => {
    const keyToCopy = pixConfig.pixKeyFormatted || '63.083.068/0001-00';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(keyToCopy);
      setCopiedPixKey(true);
      showToast(`Chave PIX CNPJ (${keyToCopy}) copiada!`, 'success');
      setTimeout(() => setCopiedPixKey(false), 3000);
    }
  };

  const handleRegisterPledge = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedTier = pixConfig.suggestedAmounts.find(
      (t) => t.amount === effectivePixAmount
    );
    const protocol = `PIX-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPledge: DonationPledgeRecord = {
      id: `pledge-${Date.now()}`,
      protocol,
      donorName: donorName.trim() || 'Apoiador Anônimo da Comunidade',
      amount: effectivePixAmount,
      purpose: matchedTier ? matchedTier.label : 'Apoio Institucional Livre',
      date: new Date().toLocaleDateString('pt-BR'),
      message: donorMessage.trim() || undefined,
      status: 'registrado',
    };

    const nextPledges = [newPledge, ...(siteSettings.donationPledges || [])];
    setSiteSettings({
      ...siteSettings,
      donationPledges: nextPledges,
    });
    addAuditLog(
      'DOACAO_PIX_REGISTRADA',
      `Registro de apoio PIX (${protocol}) de ${newPledge.donorName} no valor de R$ ${effectivePixAmount.toFixed(2)}.`
    );
    setPledgeProtocol(protocol);
    setDonorName('');
    setDonorMessage('');
    showToast('Registro de apoio institucional salvo com sucesso!', 'success');
  };

  // ============================================================================
  // IDEA 5 STATE: VOLUNTARIADO COMUNITÁRIO & IMPACTO
  // ============================================================================
  const [volName, setVolName] = useState<string>('');
  const [volArea, setVolArea] = useState<VolunteerApplicationRecord['area']>(
    'Educação Física & Esporte'
  );
  const [volAvailability, setVolAvailability] = useState<string>(
    'Sábados pela manhã (08h às 11h)'
  );
  const [volExperience, setVolExperience] = useState<string>('');
  const [volContact, setVolContact] = useState<string>('');
  const [volMotivation, setVolMotivation] = useState<string>('');
  const [volProtocol, setVolProtocol] = useState<string | null>(null);

  const handleVolunteerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volName.trim()) return;
    const protocol = `VOL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newVol: VolunteerApplicationRecord = {
      id: `vol-${Date.now()}`,
      protocol,
      name: volName.trim(),
      area: volArea,
      availability: volAvailability.trim(),
      experience: volExperience.trim() || 'Disponibilidade comunitária',
      contactInfo: volContact.trim(),
      motivation: volMotivation.trim(),
      createdAt: new Date().toLocaleDateString('pt-BR'),
      status: 'novo',
    };

    const nextVolunteers = [newVol, ...(siteSettings.volunteers || [])];
    setSiteSettings({
      ...siteSettings,
      volunteers: nextVolunteers,
    });
    addAuditLog(
      'VOLUNTARIO_CADASTRADO',
      `Nova inscrição de voluntário (${protocol}): ${newVol.name} - Área: ${newVol.area}.`
    );
    setVolProtocol(protocol);
    setVolName('');
    setVolExperience('');
    setVolContact('');
    setVolMotivation('');
    showToast('Cadastro no Programa de Voluntariado enviado com sucesso!', 'success');
  };

  // ============================================================================
  // COMPACT HOME SECTION MODE
  // ============================================================================
  if (mode === 'home_section') {
    return (
      <section className="py-16 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#0284c7] tracking-wide">
                Esporte de Base & Rede Comunitária · Cariacica/ES
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 text-balance">
                Resultados da Base, Apoio via PIX e Programa de Voluntariado
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                Acompanhe o placar e as conquistas das nossas categorias de base, apoie os projetos gratuitos via PIX oficial da Associação Vitalizar ou atue como voluntário.
              </p>
            </div>

            {onOpenFullHub && (
              <button
                type="button"
                onClick={() => onOpenFullHub('apoie-pix')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer self-start md:self-auto whitespace-nowrap shrink-0"
              >
                <span>Acessar Central Completa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Placar da Base & Galeria de Troféus */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-5 hover:border-sky-300 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-500">
                  <span>Sub-11 ao Sub-17</span>
                  <span aria-hidden="true"> · </span>
                  <span>{clubTrophies.length} Conquistas</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Jogos, Resultados & Galeria de Troféus
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Confira os placares recentes das escolinhas, próximos confrontos em Cariacica e o quadro de medalhas e troféus.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenFullHub?.('resultados')}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-[#0284c7] hover:text-white text-slate-900 text-xs font-semibold rounded-xl transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Ver Placares & Troféus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Apoie via PIX CNPJ */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-5 hover:border-sky-300 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-500 font-mono tabular-nums">
                  <span>PIX CNPJ</span>
                  <span aria-hidden="true"> · </span>
                  <span>{pixConfig.pixKeyFormatted}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Apoie via PIX & Calculadora de Impacto
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ajude a financiar bolas, coletes, lanches e uniformes para 415 crianças e idosos com QR Code e PIX Copia e Cola.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenFullHub?.('apoie-pix')}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Doar com PIX Oficial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 4: Programa de Voluntariado */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-5 hover:border-sky-300 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0284c7]">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-500">
                  <span>Rede Solidária</span>
                  <span aria-hidden="true"> · </span>
                  <span>Saúde, Esporte e Cultura</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Programa de Voluntariado & Impacto
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Credencie-se como voluntário técnico ou comunitário em nossas clínicas e conheça relatos reais das famílias atendidas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenFullHub?.('voluntariado')}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-[#0284c7] hover:text-white text-slate-900 text-xs font-semibold rounded-xl transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Ser Voluntário</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================================
  // FULL PAGE MODE
  // ============================================================================
  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-[#061a38] text-white rounded-2xl p-6 sm:p-8 border border-sky-900/60 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-sky-300 font-semibold">
            <span>Central da Comunidade & Apoio Institucional</span>
            <span aria-hidden="true"> · </span>
            <span>CNPJ {clubInfo.cnpj}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance">
            Resultados da Base, Doação PIX e Voluntariado
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/80 leading-relaxed">
            Acompanhe as competições das categorias de base, apoie financeiramente via PIX oficial ou cadastre-se como voluntário em Rio Marinho, Cariacica/ES.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
          {[
            { id: 'resultados', label: 'Jogos & Troféus', icon: Trophy },
            { id: 'apoie-pix', label: 'Apoiar via PIX', icon: QrCode },
            { id: 'voluntariado', label: 'Voluntariado', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as CommunityHubTab)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#0284c7] text-white shadow-xs'
                    : 'text-sky-100/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================================== */}
      {/* TAB 1 (IDEA 3): JOGOS, RESULTADOS & GALERIA DE TROFÉUS DA BASE */}
      {/* ======================================================================== */}
      {activeTab === 'resultados' && (
        <div className="space-y-8">
          {/* Scoreboard Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <span className="text-xs font-semibold text-[#0284c7]">
                  Competições Pedagógicas & Categorias de Base
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                  Placar de Jogos & Agenda de Confrontos da Vitalizar
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Acompanhe o desempenho das nossas equipes Sub-11, Sub-13, Sub-15 e Sub-17 em torneios municipais e festivais comunitários.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {['all', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMatchCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      matchCategoryFilter === cat
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat === 'all' ? 'Todas' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map((match) => {
                const isFinished = match.status === 'encerrado';
                return (
                  <div
                    key={match.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        <strong className="text-[#0284c7]">{match.category}</strong> ·{' '}
                        {match.competition}
                      </span>
                      <span
                        className={`font-bold uppercase text-[11px] ${
                          isFinished ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isFinished ? 'Encerrado' : 'Próximo Jogo'}
                      </span>
                    </div>

                    {/* Score Row */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 flex items-center justify-between gap-3">
                      <div className="flex-1 text-right">
                        <span className="text-sm font-extrabold text-slate-900 block">
                          {match.homeTeam}
                        </span>
                      </div>

                      <div className="px-4 py-1.5 bg-[#061a38] text-white rounded-xl font-mono tabular-nums text-lg font-extrabold flex items-center gap-2 shrink-0">
                        {isFinished ? (
                          <>
                            <span>{match.homeScore}</span>
                            <span className="text-sky-400 text-xs">×</span>
                            <span>{match.awayScore}</span>
                          </>
                        ) : (
                          <span className="text-xs font-sans font-bold px-1">VS</span>
                        )}
                      </div>

                      <div className="flex-1 text-left">
                        <span className="text-sm font-bold text-slate-700 block">
                          {match.awayTeam}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#0284c7]" />
                          <span>{match.date}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{match.location}</span>
                        </span>
                      </div>

                      {match.scorers && match.scorers.length > 0 && (
                        <p className="text-[11px] text-slate-500">
                          <strong className="text-slate-700">Gols / Parciais:</strong>{' '}
                          {match.scorers.join(', ')}
                        </p>
                      )}
                      {match.mvpPlayerName && (
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          Destaque da Partida: {match.mvpPlayerName}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trophy Gallery */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-semibold text-amber-600">
                Sala de Troféus & Reconhecimento Comunitário
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                Galeria de Títulos, Medalhas e Troféus Fair Play
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {clubTrophies.map((trophy) => (
                <div
                  key={trophy.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                        <Medal className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {trophy.year} · {trophy.category}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-amber-700">
                      {trophy.placement}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {trophy.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {trophy.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 font-medium">
                    {trophy.competition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* TAB 3 (IDEA 4): APOIE A VITALIZAR VIA PIX (CNPJ 63.083.068/0001-00) */}
      {/* ======================================================================== */}
      {activeTab === 'apoie-pix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Impact Calculator & Tier Selection */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-semibold text-emerald-700">
                Captação Transparente · Conta Institucional Auditada (Art. 30 do Estatuto)
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                Apoie os Projetos Gratuitos da Vitalizar via PIX
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                100% dos recursos doados via PIX são aplicados diretamente na compra de bolas, coletes, uniformes, lanches e manutenção das escolinhas gratuitas em Rio Marinho, Cariacica/ES.
              </p>
            </div>

            {/* Impact Tiers */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                1. Escolha uma Cota de Impacto Social ou Digite um Valor Livre:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pixConfig.suggestedAmounts.map((tier) => {
                  const isSelected =
                    !customPixAmount && selectedPixAmount === tier.amount;
                  return (
                    <button
                      key={tier.amount}
                      type="button"
                      onClick={() => {
                        setSelectedPixAmount(tier.amount);
                        setCustomPixAmount('');
                      }}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-extrabold text-slate-900 font-mono tabular-nums">
                          R$ {tier.amount.toFixed(2).replace('.', ',')}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {tier.label}
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          {tier.impactDescription}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Ou informe outro valor de contribuição (R$):
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={customPixAmount}
                  onChange={(e) => setCustomPixAmount(e.target.value)}
                  placeholder="Ex: 50,00"
                  className="w-full sm:w-64 px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Optional Donor Pledge Registration Form */}
            <form
              onSubmit={handleRegisterPledge}
              className="pt-5 border-t border-slate-200 space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Registrar Intenção de Apoio / Emitir Protocolo de Doação (Opcional)
                </h3>
                <p className="text-xs text-slate-500">
                  Informe seu nome ou empresa caso deseje constar nos agradecimentos do relatório trimestral de impacto.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Seu nome ou nome da empresa (opcional)"
                  className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                  type="text"
                  value={donorMessage}
                  onChange={(e) => setDonorMessage(e.target.value)}
                  placeholder="Mensagem de incentivo para os alunos..."
                  className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Registrar Apoio de R$ {effectivePixAmount.toFixed(2).replace('.', ',')}
              </button>

              {pledgeProtocol && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                  <span>
                    Obrigado pelo apoio! Seu protocolo de registro institucional é{' '}
                    <strong className="font-mono">{pledgeProtocol}</strong>.
                  </span>
                </div>
              )}
            </form>
          </div>

          {/* Right: Official PIX QR Code & Copy-Paste Box */}
          <div className="lg:col-span-5 bg-[#061a38] text-white rounded-2xl p-6 sm:p-8 border border-sky-900/60 space-y-5">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div>
                <span className="text-[11px] text-emerald-300 font-semibold block">
                  PIX Oficial · Banco Central (BRCode)
                </span>
                <h3 className="text-lg font-extrabold">
                  Chave {pixConfig.keyType}: {pixConfig.pixKeyFormatted}
                </h3>
              </div>
              <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
            </div>

            {/* Deterministic Crisp SVG QR Code */}
            <div className="bg-white p-4 rounded-2xl max-w-[220px] mx-auto shadow-lg">
              <svg
                viewBox="0 0 25 25"
                className="w-full h-auto aspect-square"
                shapeRendering="crispEdges"
                aria-label="QR Code PIX Associação Esportiva Vitalizar"
              >
                {qrMatrix.map((row, rIdx) =>
                  row.map((cell, cIdx) =>
                    cell ? (
                      <rect
                        key={`${rIdx}-${cIdx}`}
                        x={cIdx}
                        y={rIdx}
                        width={1}
                        height={1}
                        fill="#061a38"
                      />
                    ) : null
                  )
                )}
              </svg>
              <div className="text-center mt-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-900 font-mono tabular-nums">
                  Valor: R$ {effectivePixAmount.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Beneficiary Details */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-sky-200/80">Favorecido:</span>
                <span className="font-bold text-white">
                  Associação Esportiva Vitalizar
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sky-200/80">Chave PIX ({pixConfig.keyType}):</span>
                <span className="font-mono font-bold text-emerald-300">
                  {pixConfig.pixKeyFormatted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sky-200/80">Cidade:</span>
                <span className="font-semibold text-white">Cariacica / ES</span>
              </div>
            </div>

            {/* Copy Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleCopyPixBrCode}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {copiedPixCode ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Código PIX Copia e Cola Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Código PIX Copia e Cola</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyPixKeyOnly}
                className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-sky-100 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedPixKey ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Chave CNPJ {pixConfig.pixKeyFormatted} Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Apenas Chave CNPJ ({pixConfig.pixKeyFormatted})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* TAB 4 (IDEA 5): PROGRAMA DE VOLUNTARIADO & MURAL DE IMPACTO */}
      {/* ======================================================================== */}
      {activeTab === 'voluntariado' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Volunteer Registration Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-semibold text-[#0284c7]">
                Rede de Voluntariado & Parceria Técnica · Lei nº 9.608/1998
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                Inscreva-se como Voluntário na Associação Vitalizar
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Profissionais e estudantes de Educação Física, Fisioterapia, Nutrição, Psicologia, Fotografia/Comunicação e moradores de Cariacica podem atuar em nossas clínicas e projetos com emissão de certificado de horas complementares.
              </p>
            </div>

            <form onSubmit={handleVolunteerSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={volName}
                    onChange={(e) => setVolName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Área de Atuação Voluntária *
                  </label>
                  <select
                    value={volArea}
                    onChange={(e) =>
                      setVolArea(e.target.value as VolunteerApplicationRecord['area'])
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Educação Física & Esporte">
                      Educação Física & Esporte
                    </option>
                    <option value="Saúde, Fisio & Nutrição">
                      Saúde, Fisioterapia & Nutrição
                    </option>
                    <option value="Psicologia & Serviço Social">
                      Psicologia & Serviço Social
                    </option>
                    <option value="Comunicação, Foto & Mídia">
                      Comunicação, Fotografia & Mídia
                    </option>
                    <option value="Apoio em Eventos & Logística">
                      Apoio em Eventos & Logística
                    </option>
                    <option value="Mentoria & Educação">
                      Mentoria & Reforço Pedagógico
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Disponibilidade de Horário *
                  </label>
                  <input
                    type="text"
                    required
                    value={volAvailability}
                    onChange={(e) => setVolAvailability(e.target.value)}
                    placeholder="Ex: Sábados pela manhã ou Terças à tarde"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Canal para Retorno da Secretaria *
                  </label>
                  <input
                    type="text"
                    required
                    value={volContact}
                    onChange={(e) => setVolContact(e.target.value)}
                    placeholder="E-mail ou WhatsApp para contato da coordenação"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Formação / Experiência Prévias (CREF, CRP, Estudante, etc.)
                </label>
                <input
                  type="text"
                  value={volExperience}
                  onChange={(e) => setVolExperience(e.target.value)}
                  placeholder="Ex: Estudante 6º período de Educação Física, fotógrafo esportivo..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Como gostaria de contribuir com os projetos da Vitalizar?
                </label>
                <textarea
                  rows={3}
                  value={volMotivation}
                  onChange={(e) => setVolMotivation(e.target.value)}
                  placeholder="Conte brevemente como deseja apoiar as turmas ou eventos comunitários..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Credenciamento de Voluntário</span>
              </button>

              {volProtocol && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  Inscrição recebida com sucesso sob protocolo{' '}
                  <strong className="font-mono">{volProtocol}</strong>! Nossa coordenação técnica entrará em contato.
                </div>
              )}
            </form>
          </div>

          {/* Right: Active Volunteers & Community Testimonials */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Vozes da Comunidade de Rio Marinho
              </h3>

              <div className="space-y-3">
                <blockquote className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
                  <p className="italic leading-relaxed">
                    "Antes de entrar na escolinha de futsal da Vitalizar, meu filho passava a tarde inteira no celular. Hoje melhorou as notas na escola, fez amigos no bairro e não perde um treino."
                  </p>
                  <footer className="font-bold text-slate-900 not-italic">
                    Cláudia Ferreira · Mãe de aluno Sub-13, Rio Marinho (Cariacica/ES)
                  </footer>
                </blockquote>

                <blockquote className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
                  <p className="italic leading-relaxed">
                    "No Projeto Vida Ativa voltei a ter disposição, controlei minha pressão arterial e encontrei um grupo acolhedor toda semana perto de casa."
                  </p>
                  <footer className="font-bold text-slate-900 not-italic">
                    Dona Maria José, 68 anos · Participante do Projeto Vida Ativa
                  </footer>
                </blockquote>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Profissionais Voluntários Credenciados
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {(siteSettings.volunteers || []).filter((v) => v.status === 'ativo').length}{' '}
                  ativos
                </span>
              </div>

              <div className="space-y-2.5">
                {(siteSettings.volunteers || [])
                  .filter((v) => v.status === 'ativo')
                  .slice(0, 4)
                  .map((v) => (
                    <div
                      key={v.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs"
                    >
                      <span className="font-bold text-slate-900 block">{v.name}</span>
                      <span className="text-[#0284c7] font-semibold text-[11px] block">
                        {v.area} · {v.availability}
                      </span>
                      <p className="text-[11px] text-slate-600 mt-1">{v.experience}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
