# Shantanu Enterprises — Quotation Generator

Single-page Next.js app for generating client quotations as instant,
fully client-side PDFs. Nothing is uploaded or stored on any server.

## Stack
- Next.js 14 (App Router, TypeScript)
- Tailwind CSS 3
- @react-pdf/renderer 4 (vector PDFs generated in the browser)
- lucide-react icons

## Project layout
```
public/
  shantanu-logo.png                    # company logo (used in UI + PDF)
  shantanu_stamp-removebg-preview.png  # signatory stamp (used in PDF)
  fonts/NotoSans-*.ttf                 # bundled fonts — required for the ₹ glyph
src/
  lib/company.ts                       # static company config, types, formatters
  components/QuotationPDF.tsx          # the @react-pdf/renderer layout
  components/PDFDownloadButton.tsx     # client-only PDF generation (blob download)
  app/page.tsx                         # form, dynamic rows, live preview
```

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000
```

## Deploy to Vercel
```bash
npm i -g vercel
vercel             # accept defaults — no env vars needed
```
Or push the folder to a Git repo and import it at vercel.com/new.

## Notes for maintenance
- Company details, T&C, bank details: edit `src/lib/company.ts` only.
- The first line of each item description prints bold; lines starting with
  "Make:" or "Model" print in muted grey.
- Fonts are self-hosted in `public/fonts` (no runtime CDN dependency).
  The built-in Helvetica has no ₹ glyph — do not remove the font registration
  in `QuotationPDF.tsx`.
- `PDFDownloadButton` is loaded via `next/dynamic` with `ssr: false`; keep it
  that way or the build fails with "window is not defined".
