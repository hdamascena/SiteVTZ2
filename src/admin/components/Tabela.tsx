import React from 'react';
import { Search, X } from 'lucide-react';

export interface ColunaTabela<T> {
  id?: string;
  key?: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  sortValue?: (item: T) => string | number;
  render: (item: T) => React.ReactNode;
}

interface TabelaProps<T> {
  items?: T[];
  data?: T[];
  columns: ColunaTabela<T>[];
  keyExtractor?: (item: T) => string;
  rowKey?: (item: T) => string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  filterControls?: React.ReactNode;
  headerActions?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function Tabela<T>({
  items,
  data,
  columns,
  keyExtractor,
  rowKey,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Filtrar registros...',
  filterControls,
  headerActions,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription = 'Ajuste os filtros ou adicione um novo item.',
  emptyMessage,
  onRowClick,
}: TabelaProps<T>) {
  const list = Array.isArray(items) ? items : Array.isArray(data) ? data : [];
  const getKey =
    keyExtractor ||
    rowKey ||
    ((item: any, idx?: number) => String(item?.id ?? item?.uid ?? idx ?? 'row'));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      {(onSearchChange || filterControls || headerActions) && (
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {onSearchChange && (
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Limpar busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            {filterControls}
          </div>

          {headerActions && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-1">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {emptyMessage || emptyTitle}
          </p>
          {!emptyMessage && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {emptyDescription}
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {columns.map((col, colIdx) => (
                  <th
                    key={col.id || col.key || colIdx}
                    className={`py-2.5 px-3.5 ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {list.map((item, idx) => (
                <tr
                  key={getKey(item) || String(idx)}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.id || col.key || colIdx}
                      className={`py-2.5 px-3.5 align-middle text-slate-800 dark:text-slate-200 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
