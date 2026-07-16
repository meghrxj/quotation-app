// ---------------------------------------------------------------------------
// Shantanu Enterprises — static company configuration, shared types & helpers
// Used by both the web UI (page.tsx) and the PDF layout (QuotationPDF.tsx).
// ---------------------------------------------------------------------------

export const COMPANY = {
  name: "SHANTANU ENTERPRISES",
  slogan: "INDUSTRIAL SUPPLIES SINCE 2003",
  address: "Pirangut, Pune, Maharashtra",
  gst: "27AHCPG1372J1ZH",
  phone: "+91 7350002921  |  +91 9823671889",
  email: "shantanu.ent@gmail.com",
  website: "shantanuent.in",
  defaultSubject: "Techno-commercial offer — Fire, Safety & Rescue Products",
  bank: {
    name: "The Cosmos Co-op Bank, Paud Road, Pune",
    account: "019100102707",
    ifsc: "COSB0000019",
  },
  terms: [
    {
      title: "Prices",
      body: "All rates are net and exclusive of GST. GST will be charged as applicable.",
    },
    {
      title: "Delivery",
      body: "Door delivery. Transport charges extra at actuals.",
    },
    {
      title: "Payment",
      body: "30 days credit from invoice date via NEFT / RTGS to bank account below.",
    },
    {
      title: "Validity",
      body: "This offer is valid for 30 days from quotation date.",
    },
  ],
  closingNote: [
    "Hope this aligns with your requirements.",
    "Please let us know if you need any further clarification.",
  ],
} as const;

// Brand palette (sampled from the company logo)
export const PALETTE = {
  brand: "#467EB3",
  navy: "#1B2B3D",
  ink: "#222B36",
  muted: "#68737F",
  line: "#DDE3EA",
  soft: "#F3F6F9",
  cream: "#F4F1EA",
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuotationItem {
  id: string;
  description: string; // multiline — first line is treated as the item title
  unit: string;
  qty: string;
  rate: string;
  hsn: string;
  gst: string;
}

export interface QuotationData {
  to: string; // multiline client name + address
  quotationNo: string;
  date: string;
  subject: string; // printed as "Subject: …" under the QUOTATION title
  includeTotals: boolean; // appends TOTAL + GST summary rows to the table
  showBankDetails: boolean; // toggles the bank details block at the bottom
  items: QuotationItem[];
}

export function createEmptyItem(): QuotationItem {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: "",
    unit: "Nos",
    qty: "1",
    rate: "",
    hsn: "",
    gst: "18%",
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** 94200 -> "94,200.00" (Indian digit grouping, always 2 decimals). */
export function formatINR(value: string | number): string {
  const n =
    typeof value === "string"
      ? parseFloat(value.replace(/,/g, "").trim())
      : value;
  if (!isFinite(n)) return "0.00";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "1" -> "01", "12" -> "12", "" -> "—", "2.5" -> "2.5" */
export function formatQty(value: string): string {
  const v = value.trim();
  if (!v) return "—";
  const n = Number(v);
  if (Number.isInteger(n) && n >= 0 && n < 10) return `0${n}`;
  return v;
}

/** Serial number: 1 -> "01" */
export function formatSerial(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * Splits a multiline description into a bold title (first line)
 * and detail lines (everything after it).
 */
export function splitDescription(description: string): {
  title: string;
  details: string[];
} {
  const lines = description
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return { title: lines[0] ?? "", details: lines.slice(1) };
}

/** Lines like "Make: Udyogi" / "Model No: AM25" render in muted grey. */
export function isMutedLine(line: string): boolean {
  return /^(make|model)\b/i.test(line);
}

/** e.g. "16 July 2026" */
export function todayLongDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Totals (optional summary rows)
// ---------------------------------------------------------------------------

/** "18%" -> 18, "12 %" -> 12, "" -> 0 */
export function parseGstPercent(gst: string): number {
  const m = gst.match(/([\d.]+)/);
  const n = m ? parseFloat(m[1]) : NaN;
  return isFinite(n) ? n : 0;
}

function toNumber(v: string): number {
  const n = parseFloat(v.replace(/,/g, "").trim());
  return isFinite(n) ? n : 0;
}

/**
 * base = Σ (qty × rate); gst = Σ (qty × rate × item GST%).
 * GST is computed per item, so mixed GST rates are handled correctly.
 */
export function computeTotals(items: QuotationItem[]): {
  base: number;
  gst: number;
} {
  let base = 0;
  let gst = 0;
  for (const it of items) {
    const amount = toNumber(it.qty) * toNumber(it.rate);
    base += amount;
    gst += (amount * parseGstPercent(it.gst)) / 100;
  }
  return { base, gst };
}
