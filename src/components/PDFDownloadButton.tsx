"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import QuotationPDF from "@/components/QuotationPDF";
import type { QuotationData } from "@/lib/company";

/**
 * Generates the PDF entirely in the browser on click and triggers a download.
 * Nothing is uploaded or stored anywhere.
 *
 * This component touches browser-only APIs via @react-pdf/renderer, so it is
 * ALWAYS loaded through next/dynamic with `ssr: false` (see page.tsx) to avoid
 * "window is not defined" errors during server rendering.
 *
 * Generating on click (pdf().toBlob()) is deliberately used instead of
 * <PDFDownloadLink>, which re-renders the whole document on every keystroke.
 */
export default function PDFDownloadButton({ data }: { data: QuotationData }) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await pdf(<QuotationPDF data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Quotation_${(data.quotationNo.trim() || "Draft").replace(/[^\w.-]+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert(
        "PDF generation failed. Check that /shantanu-logo.png, /shantanu_stamp-removebg-preview.png and /fonts exist in the public folder.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Generating PDF…
        </>
      ) : (
        <>
          <Download className="h-4 w-4" aria-hidden />
          Download PDF
        </>
      )}
    </button>
  );
}
