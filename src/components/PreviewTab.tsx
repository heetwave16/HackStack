'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, RotateCcw, PlusCircle, X, Sparkles, Database } from 'lucide-react';
import { HackStackOutput, PreviewMetric } from '@/types/hackstack';

interface PreviewTabProps {
  data: HackStackOutput;
}

export default function PreviewTab({ data }: PreviewTabProps) {
  const [rows, setRows] = useState<Record<string, string>[]>(data.previewApp.sampleRows);
  const [metrics, setMetrics] = useState<PreviewMetric[]>(data.previewApp.metrics);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync state whenever data changes (e.g., preset switch or new generation)
  useEffect(() => {
    setRows(data.previewApp.sampleRows);
    setMetrics(data.previewApp.metrics);
    setSearchQuery('');
    setFormData({});
  }, [data.projectName, data.previewApp.sampleRows, data.previewApp.metrics]);

  // Open modal using native dialog
  const handleOpenModal = () => {
    const initialData: Record<string, string> = {};
    data.previewApp.columns.forEach((col) => {
      initialData[col] = '';
    });
    setFormData(initialData);
    setIsModalOpen(true);
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (dialogRef.current && dialogRef.current.open) {
      dialogRef.current.close();
    }
  };

  const handleResetData = () => {
    setRows(data.previewApp.sampleRows);
    setMetrics(data.previewApp.metrics);
    setSearchQuery('');
  };

  const handleInputChange = (column: string, value: string) => {
    setFormData((prev) => ({ ...prev, [column]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Fallback values for empty fields
    const completedRow: Record<string, string> = {};
    data.previewApp.columns.forEach((col, idx) => {
      if (formData[col] && formData[col].trim() !== '') {
        completedRow[col] = formData[col].trim();
      } else {
        completedRow[col] = idx === 0 ? `Custom Entry #${rows.length + 1}` : 'Active / In Progress';
      }
    });

    // Prepend new row
    setRows((prev) => [completedRow, ...prev]);

    // Increment the primary metric counter for instant live feedback
    setMetrics((prev) =>
      prev.map((m, idx) => {
        if (idx === 0 || m.label.toLowerCase().includes('active') || m.label.toLowerCase().includes('total')) {
          const numericPart = parseInt(m.value.replace(/[^0-9]/g, ''), 10) || 0;
          const prefix = m.value.startsWith('₹') ? '₹' : '';
          return {
            ...m,
            value: `${prefix}${numericPart + 1}`,
            trend: `+${rows.length + 1} live record added`
          };
        }
        return m;
      })
    );

    handleCloseModal();
  };

  // Filter rows based on search query across all columns
  const filteredRows = rows.filter((row) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(row).some((val) => String(val).toLowerCase().includes(query));
  });

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header with Title and Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC]">
              {data.projectName}
            </h1>
            <span className="text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/25 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Interactive Prototype
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">{data.tagline}</p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="self-start sm:self-auto bg-[#10B981] hover:bg-[#10B981]/90 text-[#090D16] font-semibold text-xs sm:text-sm py-2 px-4 rounded-lg flex items-center gap-2 transition active:scale-95 shadow-lg shadow-[#10B981]/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          {data.previewApp.quickActionLabel || '+ Add Record'}
        </button>
      </div>

      {/* 3 Metric Cards with Emerald Trend Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-1.5 shadow-sm hover:border-[#10B981]/40 transition group"
          >
            <span className="text-xs text-[#94A3B8] font-medium group-hover:text-[#CBD5E1] transition">
              {metric.label}
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#F8FAFC] tracking-tight">
              {metric.value}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#10B981] font-mono mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span className="truncate">{metric.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Primary Entity Table & Filter Controls */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Table Control Bar */}
        <div className="px-4 py-3 border-b border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A0F1D]/80">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#10B981]" />
            <h3 className="text-xs sm:text-sm font-semibold text-[#F8FAFC] uppercase tracking-wide">
              {data.previewApp.primaryEntityName}
            </h3>
            <span className="text-[11px] font-mono text-[#64748B]">({rows.length} total records)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Search Input */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter table rows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#131C2E] border border-[#1E293B] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981] w-48 sm:w-56 transition font-sans"
              />
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetData}
              title="Reset to original sample data"
              className="p-1.5 rounded-lg bg-[#131C2E] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#10B981]/50 transition flex items-center gap-1 text-xs font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Responsive, Column-Agnostic Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131C2E] border-b border-[#1E293B] text-[#94A3B8] font-mono uppercase tracking-wider">
              <tr>
                {data.previewApp.columns.map((col, idx) => (
                  <th key={idx} className="px-4 py-3 font-semibold whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60 font-sans">
              {filteredRows.length > 0 ? (
                filteredRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#131C2E]/40 transition group">
                    {data.previewApp.columns.map((col, cIdx) => {
                      const val = row[col] || '—';
                      const isStatus =
                        col.toLowerCase().includes('status') ||
                        col.toLowerCase().includes('state') ||
                        val.toLowerCase().includes('active') ||
                        val.toLowerCase().includes('delivered') ||
                        val.toLowerCase().includes('open');

                      return (
                        <td key={cIdx} className="px-4 py-3 text-[#F8FAFC] whitespace-nowrap">
                          {isStatus ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-mono text-[11px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                              {val}
                            </span>
                          ) : (
                            <span className={cIdx === 0 ? 'font-medium text-[#F8FAFC]' : 'text-[#CBD5E1]'}>
                              {val}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={data.previewApp.columns.length} className="px-4 py-8 text-center text-[#64748B]">
                    No records match &quot;{searchQuery}&quot;. Try clearing your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 bg-[#0A0F1D]/50 border-t border-[#1E293B] flex items-center justify-between text-[11px] text-[#64748B] font-mono">
          <span>
            Showing {filteredRows.length} of {rows.length} rows
          </span>
          <span className="text-[#10B981]">Schema-validated in-memory state</span>
        </div>
      </div>

      {/* Dynamic Quick Action Modal using Native Dialog */}
      <dialog
        ref={dialogRef}
        aria-labelledby="add-modal-title"
        className="backdrop:bg-black/80 backdrop:backdrop-blur-sm bg-[#0F172A] border border-[#1E293B] rounded-2xl p-0 w-full max-w-lg text-[#F8FAFC] shadow-2xl overflow-hidden focus:outline-none m-auto"
        style={{ overscrollBehavior: 'contain' }}
        onClose={() => setIsModalOpen(false)}
      >
        {isModalOpen && (
          <div className="flex flex-col">
            <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-[#131C2E]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#10B981]" />
                <h2 id="add-modal-title" className="text-sm font-semibold text-[#F8FAFC]">
                  {data.previewApp.quickActionLabel || 'Add New Record'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-lg hover:bg-[#1E293B] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 flex flex-col gap-4">
              <p className="text-xs text-[#94A3B8]">
                Provide values for each column of{' '}
                <strong className="text-[#F8FAFC]">{data.previewApp.primaryEntityName}</strong>. This record will be
                immediately inserted into local state.
              </p>

              <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {data.previewApp.columns.map((column, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono font-medium text-[#CBD5E1] capitalize">
                      {column}
                    </label>
                    <input
                      type="text"
                      required={idx === 0}
                      placeholder={`Enter ${column}...`}
                      value={formData[column] || ''}
                      onChange={(e) => handleInputChange(column, e.target.value)}
                      className="bg-[#090D16] border border-[#1E293B] rounded-lg p-2.5 text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981] font-mono transition"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1E293B] mt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg border border-[#1E293B] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#131C2E] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#10B981]/90 text-[#090D16] font-semibold text-xs shadow-lg shadow-[#10B981]/20 transition active:scale-95 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Insert Record
                </button>
              </div>
            </form>
          </div>
        )}
      </dialog>
    </div>
  );
}

