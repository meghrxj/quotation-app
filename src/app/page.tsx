"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Calculator,
  FilePlus2,
  FileText,
  Landmark,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  COMPANY,
  QuotationData,
  QuotationItem,
  computeTotals,
  createEmptyItem,
  formatINR,
  formatQty,
  formatSerial,
  isMutedLine,
  splitDescription,
  todayLongDate,
} from "@/lib/company";

// @react-pdf/renderer uses browser-only APIs, so the download button is loaded
// client-side only. `ssr: false` prevents "window is not defined" at build time.
const PDFDownloadButton = dynamic(
  () => import("@/components/PDFDownloadButton"),
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand/60 px-5 py-3.5 text-sm font-semibold text-white"
      >
        Preparing PDF engine…
      </button>
    ),
  },
);

// ---------------------------------------------------------------------------
// Small shared input styles
// ---------------------------------------------------------------------------
const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25";
const labelCls =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500";

export default function Home() {
  const [to, setTo] = useState("");
  const [quotationNo, setQuotationNo] = useState("");
  const [date, setDate] = useState("");
  const [subject, setSubject] = useState<string>(COMPANY.defaultSubject);
  const [includeTotals, setIncludeTotals] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(true);
  const [items, setItems] = useState<QuotationItem[]>([createEmptyItem()]);

  // Default the date to today after mount (avoids server/client mismatch).
  useEffect(() => {
    setDate((d) => d || todayLongDate());
  }, []);

  const updateItem = (
    id: string,
    field: keyof Omit<QuotationItem, "id">,
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  };

  const addRow = () => setItems((prev) => [...prev, createEmptyItem()]);

  const removeRow = (id: string) =>
    setItems((prev) =>
      prev.length > 1 ? prev.filter((it) => it.id !== id) : prev,
    );

  const data: QuotationData = {
    to,
    quotationNo,
    date,
    subject,
    includeTotals,
    showBankDetails,
    items,
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ------------------------------ Top bar ------------------------------ */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1480px] items-center gap-4 px-6 py-3">
          <div className="rounded-md bg-cream px-2 py-1">
            <Image
              src="/shantanu-logo.png"
              alt="Shantanu Enterprises"
              width={110}
              height={44}
              priority
            />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-navy">
              Quotation Generator
            </h1>
            <p className="text-xs text-slate-500">
              Build a quotation and download it as a PDF — instantly, fully in
              your browser.
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            No data leaves this device
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1480px] gap-6 px-6 py-6 xl:grid-cols-2">
        {/* ============================ LEFT: FORMS ============================ */}
        <div className="space-y-6">
          {/* ---- Client & quotation details ---- */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-navy">
              <FileText className="h-4 w-4 text-brand" aria-hidden />
              Client &amp; quotation details
            </h2>

            <label className={labelCls} htmlFor="subject">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Techno-commercial offer — Fire, Safety & Rescue Products"
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Prints as a bold “Subject:” line under the QUOTATION title.
            </p>

            <label className={`${labelCls} mt-4`} htmlFor="to">
              To
            </label>
            <textarea
              id="to"
              rows={4}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Enter client name and address details..."
              className={`${inputCls} resize-y leading-relaxed`}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              The first line prints in bold on the PDF (e.g. “The Safety
              Manager”).
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="qno">
                  Quotation No.
                </label>
                <input
                  id="qno"
                  type="text"
                  value={quotationNo}
                  onChange={(e) => setQuotationNo(e.target.value)}
                  placeholder="e.g. 01"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="qdate">
                  Date
                </label>
                <input
                  id="qdate"
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g. 16 July 2026"
                  className={inputCls}
                />
              </div>
            </div>

            {/* ---- Optional sections ---- */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 transition hover:border-brand/50">
                <input
                  type="checkbox"
                  checked={includeTotals}
                  onChange={(e) => setIncludeTotals(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#467EB3]"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-navy">
                    <Calculator className="h-3.5 w-3.5 text-brand" aria-hidden />
                    Add total amount
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                    Appends two separate rows to the table: TOTAL (base) and
                    GST, each calculated per item.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 transition hover:border-brand/50">
                <input
                  type="checkbox"
                  checked={showBankDetails}
                  onChange={(e) => setShowBankDetails(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#467EB3]"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-navy">
                    <Landmark className="h-3.5 w-3.5 text-brand" aria-hidden />
                    Show bank details
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                    Prints the bank details box at the very bottom of the PDF.
                  </span>
                </span>
              </label>
            </div>
          </section>

          {/* ---- Line items ---- */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                <FilePlus2 className="h-4 w-4 text-brand" aria-hidden />
                Line items
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {items.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1.5 rounded-md border border-brand/40 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add row
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex h-6 w-8 items-center justify-center rounded bg-navy text-xs font-bold text-white">
                      {formatSerial(i)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRow(item.id)}
                      disabled={items.length === 1}
                      title={
                        items.length === 1
                          ? "At least one row is required"
                          : "Remove row"
                      }
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Remove row
                    </button>
                  </div>

                  <label className={labelCls} htmlFor={`desc-${item.id}`}>
                    Description
                  </label>
                  <textarea
                    id={`desc-${item.id}`}
                    rows={3}
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, "description", e.target.value)
                    }
                    placeholder={
                      "Item title (first line prints bold)\nSpecifications, sizes, standards…\nMake: …"
                    }
                    className={`${inputCls} resize-y font-mono text-[13px] leading-relaxed`}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Line breaks are kept in the PDF. Lines starting with
                    “Make:” or “Model” print in muted grey.
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <div>
                      <label className={labelCls} htmlFor={`unit-${item.id}`}>
                        Unit
                      </label>
                      <input
                        id={`unit-${item.id}`}
                        type="text"
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(item.id, "unit", e.target.value)
                        }
                        placeholder="Nos"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor={`qty-${item.id}`}>
                        Qty
                      </label>
                      <input
                        id={`qty-${item.id}`}
                        type="number"
                        min={0}
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(item.id, "qty", e.target.value)
                        }
                        placeholder="1"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor={`rate-${item.id}`}>
                        Rate (₹)
                      </label>
                      <input
                        id={`rate-${item.id}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(item.id, "rate", e.target.value)
                        }
                        placeholder="0.00"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor={`hsn-${item.id}`}>
                        HSN
                      </label>
                      <input
                        id={`hsn-${item.id}`}
                        type="text"
                        value={item.hsn}
                        onChange={(e) =>
                          updateItem(item.id, "hsn", e.target.value)
                        }
                        placeholder="—"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor={`gst-${item.id}`}>
                        GST
                      </label>
                      <input
                        id={`gst-${item.id}`}
                        type="text"
                        value={item.gst}
                        onChange={(e) =>
                          updateItem(item.id, "gst", e.target.value)
                        }
                        placeholder="18%"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-500 transition hover:border-brand hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add row
            </button>
          </section>
        </div>

        {/* ========================= RIGHT: ACTION + PREVIEW ========================= */}
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <PDFDownloadButton data={data} />
            <p className="mt-2 text-center text-[11px] text-slate-400">
              The PDF is generated instantly in your browser. Nothing is saved
              or sent to a server.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-navy">Live preview</h2>
            <div className="max-h-[75vh] overflow-y-auto rounded-lg bg-slate-200/70 p-4">
              <QuotationPreview data={data} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live HTML preview — mirrors the structure of QuotationPDF.tsx so employees
// see what they are building before downloading.
// ---------------------------------------------------------------------------
function QuotationPreview({ data }: { data: QuotationData }) {
  const toLines = data.to
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const totals = data.includeTotals ? computeTotals(data.items) : null;

  return (
    <div className="mx-auto w-full max-w-[720px] bg-white px-8 py-7 text-ink shadow-lg">
      {/* Header: company details left, logo right */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[15px] font-bold tracking-wide text-navy">
            {COMPANY.name}
          </div>
          <div className="mb-1 text-[8px] font-bold uppercase tracking-[0.2em] text-brand">
            {COMPANY.slogan}
          </div>
          <div className="text-[10px] leading-4 text-slate-500">
            {COMPANY.address}
            <br />
            GST NO: <span className="font-semibold text-ink">{COMPANY.gst}</span>
            <br />
            Phone: <span className="font-semibold text-ink">{COMPANY.phone}</span>
            <br />
            Mail: <span className="font-semibold text-ink">{COMPANY.email}</span>
            <br />
            Website:{" "}
            <span className="font-semibold text-brand">{COMPANY.website}</span>
          </div>
        </div>
        <div className="shrink-0 rounded bg-cream p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/shantanu-logo.png"
            alt=""
            className="h-20 w-auto"
            aria-hidden
          />
        </div>
      </div>

      <hr className="my-4 border-t-2 border-brand" />

      {/* Title (left) + Subject */}
      <div className="text-[15px] font-bold tracking-wide text-navy">
        QUOTATION
      </div>
      <div className="mb-4 mt-0.5 text-[11px]">
        <span className="font-bold text-navy">Subject: </span>
        {data.subject.trim() || (
          <span className="text-slate-400">Subject will appear here…</span>
        )}
      </div>

      {/* Split address block */}
      <div className="flex gap-3">
        <div className="w-[62%] rounded bg-soft p-3">
          <div className="mb-1 text-[8px] font-bold uppercase tracking-[0.15em] text-brand">
            TO
          </div>
          {toLines.length === 0 ? (
            <div className="text-[11px] text-slate-400">
              Client name and address will appear here…
            </div>
          ) : (
            toLines.map((l, i) => (
              <div
                key={i}
                className={
                  i === 0
                    ? "text-[12px] font-bold leading-5"
                    : "text-[11px] leading-5"
                }
              >
                {l}
              </div>
            ))
          )}
        </div>
        <div className="flex-1 rounded border border-slate-200 p-3">
          <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-brand">
            QUOTATION NO.
          </div>
          <div className="text-[12px] font-bold">
            {data.quotationNo || "—"}
          </div>
          <div className="mt-2 text-[8px] font-bold uppercase tracking-[0.15em] text-brand">
            DATE
          </div>
          <div className="text-[12px] font-bold">{data.date || "—"}</div>
        </div>
      </div>

      {/* Table */}
      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr className="bg-navy text-[8.5px] font-bold uppercase tracking-wider text-white">
            <th className="w-[6%] px-1.5 py-2 text-center">#</th>
            <th className="w-[46%] px-1.5 py-2 text-left">Description</th>
            <th className="w-[8%] px-1.5 py-2 text-center">Unit</th>
            <th className="w-[7%] px-1.5 py-2 text-center">Qty</th>
            <th className="w-[14%] px-1.5 py-2 text-right">Rate (₹)</th>
            <th className="w-[10%] px-1.5 py-2 text-center">HSN</th>
            <th className="w-[9%] px-1.5 py-2 text-center">GST</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => {
            const { title, details } = splitDescription(item.description);
            return (
              <tr
                key={item.id}
                className={`border-b border-slate-200 align-top ${
                  i % 2 === 1 ? "bg-slate-50" : ""
                }`}
              >
                <td className="px-1.5 py-2.5 text-center text-[10px]">
                  {formatSerial(i)}
                </td>
                <td className="px-1.5 py-2.5">
                  <div className="text-[11px] font-bold leading-4">
                    {title || <span className="text-slate-400">—</span>}
                  </div>
                  {details.map((d, j) => (
                    <div
                      key={j}
                      className={`mt-0.5 text-[10px] leading-4 ${
                        isMutedLine(d) ? "text-slate-500" : ""
                      }`}
                    >
                      {d}
                    </div>
                  ))}
                </td>
                <td className="px-1.5 py-2.5 text-center text-[10px]">
                  {item.unit.trim() || "—"}
                </td>
                <td className="px-1.5 py-2.5 text-center text-[10px]">
                  {formatQty(item.qty)}
                </td>
                <td className="px-1.5 py-2.5 text-right text-[10px]">
                  {formatINR(item.rate)}
                </td>
                <td className="px-1.5 py-2.5 text-center text-[10px]">
                  {item.hsn.trim() || "—"}
                </td>
                <td className="px-1.5 py-2.5 text-center text-[10px]">
                  {item.gst.trim() || "—"}
                </td>
              </tr>
            );
          })}

          {/* Optional summary rows */}
          {totals && (
            <>
              <tr className="border-b border-slate-200 border-t-2 border-t-navy bg-soft">
                <td
                  colSpan={4}
                  className="px-1.5 py-2 text-right text-[10px] font-bold tracking-wider text-navy"
                >
                  TOTAL (₹)
                </td>
                <td className="px-1.5 py-2 text-right text-[10.5px] font-bold">
                  {formatINR(totals.base)}
                </td>
                <td colSpan={2} />
              </tr>
              <tr className="border-b border-slate-200 bg-soft">
                <td
                  colSpan={4}
                  className="px-1.5 py-2 text-right text-[10px] font-bold tracking-wider text-navy"
                >
                  GST (₹)
                </td>
                <td className="px-1.5 py-2 text-right text-[10.5px] font-bold">
                  {formatINR(totals.gst)}
                </td>
                <td colSpan={2} />
              </tr>
            </>
          )}
        </tbody>
      </table>

      {/* Terms */}
      <div className="mt-5 text-[11px] font-bold uppercase tracking-[0.1em] text-brand">
        Terms &amp; Conditions
      </div>
      <div className="mt-2 space-y-1.5">
        {COMPANY.terms.map((t, i) => (
          <div key={t.title} className="flex text-[11px] leading-5">
            <span className="w-7 shrink-0 font-bold text-brand">
              {formatSerial(i)}
            </span>
            <span>
              <span className="font-bold">{t.title}</span> — {t.body}
            </span>
          </div>
        ))}
      </div>

      {/* Sign-off (left-aligned) */}
      <div className="mt-4 text-[11px] leading-5">
        {COMPANY.closingNote[0]}
        <br />
        {COMPANY.closingNote[1]}
      </div>

      {/* Authorised signatory block (left) */}
      <div className="mt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/shantanu_stamp-removebg-preview.png"
          alt=""
          aria-hidden
          className="mb-1 h-[74px] w-auto opacity-90"
        />
        <div className="text-[10px] italic text-slate-500">
          Authorised signatory
        </div>
        <div className="text-[12px] font-bold tracking-wide text-navy">
          {COMPANY.name}
        </div>
        <div className="mt-0.5 text-[10px] leading-4">
          {COMPANY.address}
          <br />
          {COMPANY.phone}
          <br />
          GST NO: {COMPANY.gst}
          <br />
          <span className="font-bold">{COMPANY.email}</span>
        </div>
      </div>

      {/* Bank details (very bottom, optional) */}
      {data.showBankDetails && (
        <div className="mt-4 w-[56%] rounded-r border-l-[3px] border-brand bg-soft px-3.5 py-3">
          <div className="mb-1.5 text-[8px] font-bold uppercase tracking-[0.15em] text-brand">
            Bank Details
          </div>
          <div className="space-y-0.5 text-[10px]">
            <div className="flex">
              <span className="w-20 shrink-0 text-slate-500">Bank Name</span>
              <span className="font-bold">{COMPANY.bank.name}</span>
            </div>
            <div className="flex">
              <span className="w-20 shrink-0 text-slate-500">Account No.</span>
              <span className="font-bold">{COMPANY.bank.account}</span>
            </div>
            <div className="flex">
              <span className="w-20 shrink-0 text-slate-500">IFSC Code</span>
              <span className="font-bold">{COMPANY.bank.ifsc}</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer strip */}
      <div className="mt-6 border-t border-slate-200 pt-2 text-center text-[9px] text-slate-400">
        Shantanu Enterprises · Pirangut, Pune · {COMPANY.website} · Page 1 of 1
      </div>
    </div>
  );
}
