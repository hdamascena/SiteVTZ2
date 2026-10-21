import React, { useState, useMemo } from 'react';
import { Search, X, ArrowRight, Trophy, Calendar, FileText, MapPin } from 'lucide-react';
import { useClubData } from '../context/ClubDataContext.tsx';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: string, id: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const { newsArticles, events, projects, transparencyDocs, sponsors, siteSettings } = useClubData();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'eventos' | 'projetos' | 'transparencia' | 'noticia' | 'patrocinadores' | 'documentos'
  >('all');

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: 'eventos' | 'projetos' | 'transparencia' | 'noticia' | 'patrocinadores' | 'documentos';
      actionType: string;
    }> = [];

    // Search Events (Clinics, Workshops, Meetings)
    if (categoryFilter === 'all' || categoryFilter === 'eventos') {
      events.forEach((ev) => {
        if (
          ev.title.toLowerCase().includes(q) ||
          ev.description.toLowerCase().includes(q) ||
          ev.location.toLowerCase().includes(q) ||
          ev.coordinator.toLowerCase().includes(q)
        ) {
          items.push({
            id: ev.id,
            title: ev.title,
            subtitle: `${ev.formattedDate} • ${ev.categoryLabel} • ${ev.location}`,
            type: 'eventos',
            actionType: 'eventos',
          });
        }
      });
    }

    // Search Vitalizar projects
    if (categoryFilter === 'all' || categoryFilter === 'projetos') {
      projects.forEach((p) => {
        const matchTag = p.tags?.some((t) => t.toLowerCase().includes(q));
        if (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.targetAudience.toLowerCase().includes(q) ||
          matchTag
        ) {
          items.push({
            id: p.id,
            title: p.name,
            subtitle: `${p.targetAudience} • ${p.schedule}`,
            type: 'projetos',
            actionType: 'projetos',
          });
        }
      });
    }

    // Search Transparency docs
    if (categoryFilter === 'all' || categoryFilter === 'transparencia' || categoryFilter === 'documentos') {
      transparencyDocs.forEach((doc) => {
        if (doc.title.toLowerCase().includes(q) || doc.description.toLowerCase().includes(q)) {
          items.push({
            id: doc.id,
            title: doc.title,
            subtitle: `${doc.date} • ${doc.badge}`,
            type: 'transparencia',
            actionType: 'transparencia',
          });
        }
      });
    }

    // Search News
    if (categoryFilter === 'all' || categoryFilter === 'noticia') {
      newsArticles.forEach((n) => {
        const matchTag = n.tags?.some((t) => t.toLowerCase().includes(q));
        if (
          n.title.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q) ||
          matchTag
        ) {
          items.push({
            id: n.id,
            title: n.title,
            subtitle: `${n.date} • ${n.category}`,
            type: 'noticia',
            actionType: 'noticia',
          });
        }
      });
    }

    // Search Sponsors & Partners
    if (categoryFilter === 'all' || categoryFilter === 'patrocinadores') {
      sponsors
        .filter((s) => s.active)
        .forEach((s) => {
          if (
            s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q) ||
            s.tierLabel.toLowerCase().includes(q) ||
            q.includes('patrocin') ||
            q.includes('parceir')
          ) {
            items.push({
              id: s.id,
              title: s.name,
              subtitle: `${s.tierLabel} • ${s.category}`,
              type: 'patrocinadores',
              actionType: 'patrocinadores',
            });
          }
        });
    }

    // Fixed institutional topics
    if (categoryFilter === 'all' || categoryFilter === 'documentos') {
      const docs = [
        { id: 'estatuto-social', title: 'Estatuto Social 2026 (Consolidado)', sub: 'Associação Esportiva Vitalizar • Cariacica' },
        { id: 'diretoria-conselhos', title: 'Composição da Diretoria Executiva e Conselhos', sub: 'Presidente Gabriel Guedes Venâncio' },
        { id: 'sede-polos', title: 'Sede Rio Marinho e Polos de Treinamento', sub: 'Rua Quatro, 173, Rio Marinho, Cariacica/ES' },
        { id: 'prestacao-contas', title: 'Prestação de Contas (Art. 30)', sub: 'Demonstrativos e relatórios anuais de atividades' },
        { id: 'voluntariado', title: 'Programa de Voluntários e Apoio Comunitário', sub: 'Art. 6º, III do Estatuto Social' },
      ];

      docs.forEach((d) => {
        if (d.title.toLowerCase().includes(q) || d.sub.toLowerCase().includes(q)) {
          items.push({
            id: d.id,
            title: d.title,
            subtitle: d.sub,
            type: 'documentos',
            actionType: 'a-vitalizar',
          });
        }
      });
    }

    return items;
  }, [query, categoryFilter, events, projects, transparencyDocs, newsArticles, sponsors]);

  if (!isOpen) return null;

  const suggestions =
    siteSettings.searchSuggestions && siteSettings.searchSuggestions.length > 0
      ? siteSettings.searchSuggestions
      : ['Clínica de Futsal', 'Primeiros Socorros', 'Assembleia Geral', 'Vida Ativa', 'Transparência', 'Cariacica'];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-[#0284c7]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O que você procura na Vitalizar? (ex: futsal, estatuto, cnpj, terceira idade, voluntariado...)"
            className="w-full text-sm sm:text-base bg-transparent border-0 focus:outline-none text-slate-800 placeholder-slate-400 font-medium"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-bold uppercase text-[10px]">Filtrar:</span>
          {(['all', 'eventos', 'projetos', 'transparencia', 'noticia', 'patrocinadores', 'documentos'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setCategoryFilter(filter)}
              className={`px-3 py-1 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer shrink-0 ${
                categoryFilter === filter
                  ? 'bg-[#0284c7] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {filter === 'all'
                ? 'Tudo'
                : filter === 'eventos'
                ? 'Eventos & Clínicas'
                : filter === 'projetos'
                ? 'Projetos'
                : filter === 'transparencia'
                ? 'Transparência'
                : filter === 'noticia'
                ? 'Notícias'
                : filter === 'patrocinadores'
                ? 'Parceiros'
                : 'Documentos'}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="max-h-[380px] overflow-y-auto p-4 divide-y divide-slate-100">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-slate-500 space-y-3">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">
                Digite um termo para pesquisar clínicas esportivas, oficinas, reuniões, modalidades e prestação de contas.
              </p>
              <div className="pt-1 flex flex-wrap justify-center gap-1.5 text-[11px]">
                <span className="text-slate-400">Sugestões:</span>
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => setQuery(sug)}
                    className="text-[#0284c7] font-semibold underline hover:text-[#0369a1] px-1 cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
              {siteSettings.siteTags && siteSettings.siteTags.length > 0 && (
                <div className="pt-2 flex flex-wrap justify-center gap-1.5 text-[10px]">
                  <span className="text-slate-400 font-semibold">Tags populares:</span>
                  {siteSettings.siteTags.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-[#0284c7] rounded border border-slate-200 font-medium cursor-pointer transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <p className="text-sm font-semibold">Nenhum resultado encontrado para "{query}"</p>
              <p className="text-xs text-slate-400">
                Tente palavras mais genéricas como "futsal", "vôlei", "oficina", "reunião", "estatuto" ou "contato".
              </p>
            </div>
          ) : (
            searchResults.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  onSelectAction(item.actionType, item.id);
                  onClose();
                }}
                className="w-full text-left py-3 px-3 hover:bg-sky-50/70 rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sky-100 text-[#0284c7] rounded-lg mt-0.5 group-hover:bg-[#0284c7] group-hover:text-white transition-colors">
                    {item.type === 'eventos' && <Calendar className="w-4 h-4" />}
                    {item.type === 'projetos' && <Trophy className="w-4 h-4" />}
                    {item.type === 'transparencia' && <FileText className="w-4 h-4" />}
                    {item.type === 'noticia' && <Calendar className="w-4 h-4" />}
                    {item.type === 'patrocinadores' && <Trophy className="w-4 h-4" />}
                    {item.type === 'documentos' && <MapPin className="w-4 h-4" />}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">{item.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-sky-50 text-[#0284c7] border border-sky-200 rounded">
                    {item.type}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0284c7] group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
