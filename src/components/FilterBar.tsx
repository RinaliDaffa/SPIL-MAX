import React from 'react';
import { X } from 'lucide-react';
import PickerPure from './PickerPure';

export interface CatalogFilters {
  kind: string;
  division: string;
  unwatchedOnly: boolean;
  sort: string;
}

export const EMPTY_FILTERS: CatalogFilters = {
  kind: '',
  division: '',
  unwatchedOnly: false,
  sort: 'featured',
};

interface FilterBarProps {
  kinds: { value: string; label: string; count: number }[];
  divisions: { value: string; label: string; count: number }[];
  value: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
  onReset: () => void;
  count?: number;
}

/**
 * Apple TV+ Subtle Filter & Sort Pills — Adapted from NovaStream FilterBar (MIT).
 */
export default function FilterBar({
  kinds,
  divisions,
  value,
  onChange,
  onReset,
  count,
}: FilterBarProps) {
  const dirty = Boolean(
    value.kind || value.division || value.unwatchedOnly || (value.sort && value.sort !== 'featured')
  );

  return (
    <div className="px-5 md:px-8 tv:px-14 mb-6">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <PickerPure
          label="Jenis Kompetensi"
          title="Filter Jenis Kompetensi"
          value={value.kind}
          onPick={(v) => onChange({ ...value, kind: v === value.kind ? '' : v })}
          options={[
            { value: '', label: 'Semua Jenis Kompetensi' },
            ...kinds,
          ]}
        />

        <PickerPure
          label="Divisi / Fokus"
          title="Filter Divisi & Fokus"
          value={value.division}
          onPick={(v) => onChange({ ...value, division: v === value.division ? '' : v })}
          options={[
            { value: '', label: 'Semua Divisi' },
            ...divisions,
          ]}
        />

        <button
          type="button"
          data-tv-focus
          onClick={() => onChange({ ...value, unwatchedOnly: !value.unwatchedOnly })}
          className={`h-9 tv:h-11 px-4 rounded-full text-[13px] tv:text-[15px] font-medium shrink-0 border transition-colors ${
            value.unwatchedOnly
              ? 'bg-white text-black border-white'
              : 'bg-white/[0.09] text-white/80 border-white/10 hover:bg-white/[0.15]'
          }`}
        >
          Belum Selesai
        </button>

        <PickerPure
          label="Urutkan"
          title="Urutkan Modul"
          value={value.sort}
          onPick={(v) => onChange({ ...value, sort: v || 'featured' })}
          options={[
            { value: 'featured', label: 'Rekomendasi Utama' },
            { value: 'popular', label: 'Terpopuler di SPIL' },
            { value: 'levels', label: 'Jumlah Level Terbanyak' },
            { value: 'az', label: 'Judul A → Z' },
          ]}
        />

        {dirty && (
          <button
            type="button"
            onClick={onReset}
            className="h-9 tv:h-11 px-3.5 rounded-full text-[13px] tv:text-[15px] font-medium text-white/55 hover:text-white shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <X size={14} /> Reset
          </button>
        )}
      </div>

      {dirty && count != null && (
        <p className="text-[12px] tv:text-[14px] p-faint mt-2.5">{count} modul ditemukan</p>
      )}
    </div>
  );
}
