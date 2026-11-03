'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Database, PlusCircle, RotateCcw, Search, X } from 'lucide-react';
import { HackStackOutput, PreviewMetric } from '@/types/hackstack';

interface PreviewTabProps {
  data: HackStackOutput;
}

const NUMBER_PATTERN = /^([^\d]*?)([\d,]+)(.*)$/;

function bumpLeadingNumber(metric: PreviewMetric, addedCount: number): PreviewMetric {
  const match = metric.value.match(NUMBER_PATTERN);
  if (!match) return { ...metric, trend: `+${addedCount} added in this session` };
  const [, prefix, digits, suffix] = match;
  const next = Number(digits.replace(/,/g, '')) + 1;
  return {
    ...metric,
    value: `${prefix}${next.toLocaleString('en-US')}${suffix}`,
    trend: `+${addedCount} added in this session`
  };
}

export default function PreviewTab({ data }: PreviewTabProps) {
  const [rows, setRows] = useState<Record<string, string>[]>(data.previewApp.sampleRows);
  const [metrics, setMetrics] = useState<PreviewMetric[]>(data.previewApp.metrics);
  const [addedCount, setAddedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setRows(data.previewApp.sampleRows);
    setMetrics(data.previewApp.metrics);
    setAddedCount(0);
    setSearchQuery('');
    setFormData({});
  }, [data.projectName, data.previewApp.sampleRows, data.previewApp.metrics]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isModalOpen && !dialog.open) dialog.showModal();
    if (!isModalOpen && dialog.open) dialog.close();
  }, [isModalOpen]);

  const handleOpenModal = () => {
    const initialData: Record<string, string> = {};
    data.previewApp.columns.forEach((col) => {
      initialData[col] = '';
    });
    setFormData(initialData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleResetData = () => {
    setRows(data.previewApp.sampleRows);
    setMetrics(data.previewApp.metrics);
    setAddedCount(0);
    setSearchQuery('');
  };

  const handleInputChange = (column: string, value: string) => {
    setFormData((prev) => ({ ...prev, [column]: value }));
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const completedRow: Record<string, string> = {};
    data.previewApp.columns.forEach((col, idx) => {
      const typed = formData[col]?.trim();
      completedRow[col] = typed ? typed : idx === 0 ? `Custom entry #${rows.length + 1}` : 'Active / in progress';
    });

    const nextAddedCount = addedCount + 1;
    setRows((prev) => [completedRow, ...prev]);
    setAddedCount(nextAddedCount);
    setMetrics((prev) => prev.map((metric, idx) => (idx === 0 ? bumpLeadingNumber(metric, nextAddedCount) : metric)));
    handleCloseModal();
  };

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(query)));
  }, [rows, searchQuery]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-[#1E293B] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#10B981]">Live preview</p>
          <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-[#F8FAFC] sm:text-2xl">{data.projectName}</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">{data.tagline}</p>
        </div>
        <button
          type="button"
          onClick={handleOpenModal}
          className="flex shrink-0 items-center gap-2 self-start rounded-md bg-[#10B981] px-4 py-2 text-sm font-semibold text-[#090D16] transition-colors hover:bg-[#34D399] sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          {data.previewApp.quickActionLabel || '+ Add record'}
        </button>
      </div>

      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#1E293B] bg-[#1E293B] sm:grid-cols-3">
        {metrics.map((metric, idx) => (
          <div key={`${metric.label}-${idx}`} className="flex flex-col gap-2 bg-[#0D1322] p-5">
            <dt className="text-xs font-medium text-[#94A3B8]">{metric.label}</dt>
            <dd className="font-mono text-2xl font-semibold tracking-tight text-[#F8FAFC] sm:text-3xl">{metric.value}</dd>
            <dd className="truncate font-mono text-[11px] text-[#10B981]">{metric.trend}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col overflow-hidden rounded-xl border border-[#1E293B] bg-[#0D1322]">
        <div className="flex flex-col gap-3 border-b border-[#1E293B] bg-[#0A0F1D] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#F8FAFC]">{data.previewApp.primaryEntityName}</h3>
            <span className="font-mono text-[11px] text-[#64748B]">{rows.length} records</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative flex items-center">
              <span className="sr-only">Filter rows</span>
              <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#64748B]" aria-hidden="true" />
              <input
                type="text"
                placeholder="Filter rows"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-48 rounded-md border border-[#1E293B] bg-[#131C2E] py-1.5 pl-8 pr-3 text-xs text-[#F8FAFC] placeholder:text-[#64748B] transition-colors focus:border-[#10B981] focus:outline-none sm:w-56"
              />
            </label>
            <button
              type="button"
              onClick={handleResetData}
              title="Reset to the original sample data"
              className="flex items-center gap-1.5 rounded-md border border-[#1E293B] bg-[#131C2E] px-2.5 py-1.5 font-mono text-xs text-[#94A3B8] transition-colors hover:border-[#334155] hover:text-[#F8FAFC]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden md:inline">Reset</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#1E293B] bg-[#131C2E] font-mono uppercase tracking-wider text-[#94A3B8]">
              <tr>
                {data.previewApp.columns.map((col) => (
                  <th key={col} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {filteredRows.length > 0 ? (
                filteredRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="transition-colors hover:bg-[#131C2E]/50">
                    {data.previewApp.columns.map((col, colIndex) => {
                      const value = row[col] || '-';
                      const isStatus = /status|state/i.test(col) || /active|delivered|open|locked|pooling/i.test(value);
                      return (
                        <td key={col} className="whitespace-nowrap px-4 py-3">
                          {isStatus ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-2.5 py-0.5 font-mono text-[11px] text-[#10B981]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                              {value}
                            </span>
                          ) : (
                            <span className={colIndex === 0 ? 'font-medium text-[#F8FAFC]' : 'text-[#CBD5E1]'}>{value}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={data.previewApp.columns.length} className="px-4 py-8 text-center text-[#94A3B8]">
                    No rows match &quot;{searchQuery}&quot;. Clear the filter to see every row.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#1E293B] bg-[#0A0F1D] px-4 py-2 font-mono text-[11px] text-[#64748B]">
          <span>
            Showing {filteredRows.length} of {rows.length} rows
          </span>
          <span>In-memory state</span>
        </div>
      </section>

      <dialog
        ref={dialogRef}
        aria-labelledby="add-record-title"
        onClose={handleCloseModal}
        className="m-auto w-full max-w-lg overflow-hidden rounded-xl border border-[#1E293B] bg-[#0D1322] p-0 text-[#F8FAFC] backdrop:bg-black/70 focus:outline-none"
      >
        {isModalOpen && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between border-b border-[#1E293B] bg-[#131C2E] px-6 py-4">
              <h2 id="add-record-title" className="text-sm font-semibold text-[#F8FAFC]">
                {data.previewApp.quickActionLabel || 'Add new record'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Close"
                className="rounded-md p-1 text-[#94A3B8] transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 p-6">
              <p className="text-xs text-[#94A3B8]">
                Fill in each column of <strong className="text-[#F8FAFC]">{data.previewApp.primaryEntityName}</strong>. The row is added to the top of the table.
              </p>

              <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto pr-1">
                {data.previewApp.columns.map((column, idx) => (
                  <label key={column} className="flex flex-col gap-1.5">
                    <span className="font-mono text-xs text-[#CBD5E1]">{column}</span>
                    <input
                      type="text"
                      required={idx === 0}
                      placeholder={`Enter ${column}`}
                      value={formData[column] ?? ''}
                      onChange={(event) => handleInputChange(column, event.target.value)}
                      className="rounded-md border border-[#1E293B] bg-[#090D16] p-2.5 font-mono text-xs text-[#F8FAFC] placeholder:text-[#64748B] transition-colors focus:border-[#10B981] focus:outline-none"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-[#1E293B] pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-md border border-[#1E293B] px-4 py-2 text-xs font-medium text-[#94A3B8] transition-colors hover:bg-[#131C2E] hover:text-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-md bg-[#10B981] px-4 py-2 text-xs font-semibold text-[#090D16] transition-colors hover:bg-[#34D399]"
                >
                  <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Insert record
                </button>
              </div>
            </form>
          </div>
        )}
      </dialog>
    </div>
  );
}
