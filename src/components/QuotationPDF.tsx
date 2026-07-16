import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import {
  COMPANY,
  PALETTE,
  QuotationData,
  computeTotals,
  formatINR,
  formatQty,
  formatSerial,
  splitDescription,
  isMutedLine,
} from "@/lib/company";

// ---------------------------------------------------------------------------
// Fonts — Noto Sans is bundled in /public/fonts and contains the ₹ glyph,
// which the built-in Helvetica does not. Registered once at module level.
// ---------------------------------------------------------------------------
Font.register({
  family: "NotoSans",
  fonts: [
    { src: "/fonts/NotoSans-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/NotoSans-Bold.ttf", fontWeight: 700 },
    { src: "/fonts/NotoSans-Italic.ttf", fontWeight: 400, fontStyle: "italic" },
    { src: "/fonts/NotoSans-BoldItalic.ttf", fontWeight: 700, fontStyle: "italic" },
  ],
});

// Prevent react-pdf from hyphen-breaking words like "Retractable" mid-word.
Font.registerHyphenationCallback((word) => [word]);

const { brand, navy, ink, muted, line, soft, cream } = PALETTE;

// Table column widths (must total 100%)
const COL = {
  num: "6%",
  desc: "46%",
  unit: "8%",
  qty: "7%",
  rate: "14%",
  hsn: "10%",
  gst: "9%",
} as const;

// Width of the right-aligned label cell in the TOTAL / GST summary rows
// (# + DESCRIPTION + UNIT + QTY columns combined).
const TOTAL_LABEL_WIDTH = "67%";

const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 42,
    paddingBottom: 66,
    fontFamily: "NotoSans",
    fontSize: 9,
    color: ink,
  },

  // ---- Header: company details LEFT, logo RIGHT ---------------------------
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { alignItems: "flex-start" },
  logoTile: {
    backgroundColor: cream,
    borderRadius: 4,
    padding: 9,
  },
  logo: { width: 195, height: 78, objectFit: "contain" },
  companyName: {
    fontSize: 15,
    fontWeight: 700,
    color: navy,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 7,
    fontWeight: 700,
    color: brand,
    letterSpacing: 1.6,
    marginTop: 2,
    marginBottom: 5,
  },
  headerLine: { fontSize: 8.5, color: muted, marginTop: 1.5 },
  headerStrong: { color: ink, fontWeight: 700 },
  headerBrand: { color: brand, fontWeight: 700 },
  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: brand,
    marginTop: 14,
    marginBottom: 18,
  },

  // ---- Title (left-aligned) + Subject line ---------------------------------
  title: {
    fontSize: 14,
    fontWeight: 700,
    color: navy,
    letterSpacing: 0.5,
    textAlign: "left",
  },
  subjectLine: {
    fontSize: 9.5,
    textAlign: "left",
    marginTop: 4,
    marginBottom: 16,
  },
  subjectLabel: { fontWeight: 700, color: navy },

  // ---- Split address block ---------------------------------------------------
  metaRow: { flexDirection: "row" },
  toBox: {
    width: "62%",
    backgroundColor: soft,
    borderRadius: 3,
    padding: 10,
    marginRight: 12,
  },
  metaBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: line,
    borderRadius: 3,
    padding: 10,
  },
  metaLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: brand,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  toFirstLine: { fontSize: 10, fontWeight: 700, lineHeight: 1.4 },
  toLine: { fontSize: 9, lineHeight: 1.4 },
  metaValue: { fontSize: 10, fontWeight: 700 },

  // ---- Table --------------------------------------------------------------
  table: { marginTop: 16 },
  th: {
    flexDirection: "row",
    backgroundColor: navy,
    alignItems: "center",
  },
  thCell: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#FFFFFF",
    letterSpacing: 0.6,
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: line,
  },
  trAlt: { backgroundColor: "#F8FAFC" },
  td: { paddingVertical: 8, paddingHorizontal: 6 },
  tdText: { fontSize: 8.5 },
  descTitle: { fontSize: 9, fontWeight: 700, lineHeight: 1.35 },
  descLine: { fontSize: 8, lineHeight: 1.4, marginTop: 2 },
  descMuted: { color: muted },
  center: { textAlign: "center" },
  right: { textAlign: "right" },

  // ---- Optional TOTAL / GST summary rows ------------------------------------
  totalRow: {
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: line,
    backgroundColor: soft,
  },
  totalRowFirst: { borderTopWidth: 1.5, borderTopColor: navy },
  totalLabel: {
    fontSize: 8.5,
    fontWeight: 700,
    color: navy,
    letterSpacing: 0.6,
    textAlign: "right",
  },
  totalValue: { fontSize: 9, fontWeight: 700, textAlign: "right" },

  // ---- Terms & conditions ---------------------------------------------------
  termsHeading: {
    fontSize: 9.5,
    fontWeight: 700,
    color: brand,
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 8,
  },
  termRow: { flexDirection: "row", marginBottom: 5 },
  termNum: {
    width: 22,
    fontSize: 8.5,
    fontWeight: 700,
    color: brand,
  },
  termText: { flex: 1, fontSize: 9, lineHeight: 1.45 },

  // ---- Sign-off (left-aligned) -----------------------------------------------
  signOff: {
    fontSize: 9,
    color: ink,
    textAlign: "left",
    lineHeight: 1.5,
    marginTop: 14,
  },

  // ---- Authorised signatory block (left, above bank details) ------------------
  signatoryBlock: {
    marginTop: 18,
    alignItems: "flex-start",
  },
  stamp: { width: 74, height: 77, opacity: 0.92, marginBottom: 4 },
  signatoryLabel: {
    fontSize: 8.5,
    fontStyle: "italic",
    color: muted,
  },
  signatoryName: {
    fontSize: 10.5,
    fontWeight: 700,
    color: navy,
    letterSpacing: 0.4,
    marginTop: 2,
    marginBottom: 3,
  },
  signatoryLine: { fontSize: 8.5, color: ink, marginTop: 1.5 },
  signatoryEmail: { fontSize: 8.5, fontWeight: 700, color: ink, marginTop: 1.5 },

  // ---- Bank details (very bottom, optional) ------------------------------------
  bankBox: {
    width: "56%",
    backgroundColor: soft,
    borderLeftWidth: 3,
    borderLeftColor: brand,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  bankRow: { flexDirection: "row", marginBottom: 3.5 },
  bankLabel: { width: 74, fontSize: 8.5, color: muted },
  bankValue: { flex: 1, fontSize: 8.5, fontWeight: 700 },

  // ---- Fixed page footer ---------------------------------------------------------
  pageFooter: {
    position: "absolute",
    bottom: 24,
    left: 42,
    right: 42,
    borderTopWidth: 0.75,
    borderTopColor: line,
    paddingTop: 6,
    alignItems: "center",
  },
  pageFooterText: { fontSize: 7.5, color: muted },
});

// ---------------------------------------------------------------------------

function DescriptionCell({ description }: { description: string }) {
  const { title, details } = splitDescription(description);
  return (
    <View style={[s.td, { width: COL.desc }]}>
      <Text style={s.descTitle}>{title || "—"}</Text>
      {details.map((d, i) => (
        <Text
          key={i}
          style={isMutedLine(d) ? [s.descLine, s.descMuted] : s.descLine}
        >
          {d}
        </Text>
      ))}
    </View>
  );
}

function SummaryRow({
  label,
  value,
  first,
}: {
  label: string;
  value: number;
  first?: boolean;
}) {
  return (
    <View
      wrap={false}
      style={first ? [s.totalRow, s.totalRowFirst] : s.totalRow}
    >
      <Text style={[s.td, s.totalLabel, { width: TOTAL_LABEL_WIDTH }]}>
        {label}
      </Text>
      <Text style={[s.td, s.totalValue, { width: COL.rate }]}>
        {formatINR(value)}
      </Text>
      <Text style={[s.td, { width: COL.hsn }]} />
      <Text style={[s.td, { width: COL.gst }]} />
    </View>
  );
}

export default function QuotationPDF({ data }: { data: QuotationData }) {
  const toLines = data.to
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const totals = data.includeTotals ? computeTotals(data.items) : null;

  return (
    <Document
      title={`Quotation ${data.quotationNo || ""} — ${COMPANY.name}`}
      author={COMPANY.name}
    >
      <Page size="A4" style={s.page}>
        {/* ---------------- Header: company details left, logo right -------- */}
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Text style={s.companyName}>{COMPANY.name}</Text>
            <Text style={s.tagline}>{COMPANY.slogan}</Text>
            <Text style={s.headerLine}>{COMPANY.address}</Text>
            <Text style={s.headerLine}>
              GST NO: <Text style={s.headerStrong}>{COMPANY.gst}</Text>
            </Text>
            <Text style={s.headerLine}>
              Phone: <Text style={s.headerStrong}>{COMPANY.phone}</Text>
            </Text>
            <Text style={s.headerLine}>
              Mail: <Text style={s.headerStrong}>{COMPANY.email}</Text>
            </Text>
            <Text style={s.headerLine}>
              Website: <Text style={s.headerBrand}>{COMPANY.website}</Text>
            </Text>
          </View>
          <View style={s.logoTile}>
            <Image src="/shantanu-logo.png" style={s.logo} />
          </View>
        </View>

        <View style={s.divider} />

        {/* ---------------- Title (left) + Subject field --------------------- */}
        <Text style={s.title}>QUOTATION</Text>
        <Text style={s.subjectLine}>
          <Text style={s.subjectLabel}>Subject: </Text>
          {data.subject.trim() || "—"}
        </Text>

        {/* ---------------- Split address block ------------------------------ */}
        <View style={s.metaRow}>
          <View style={s.toBox}>
            <Text style={s.metaLabel}>TO</Text>
            {toLines.length === 0 ? (
              <Text style={s.toLine}>—</Text>
            ) : (
              toLines.map((l, i) => (
                <Text key={i} style={i === 0 ? s.toFirstLine : s.toLine}>
                  {l}
                </Text>
              ))
            )}
          </View>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>QUOTATION NO.</Text>
            <Text style={s.metaValue}>{data.quotationNo || "—"}</Text>
            <Text style={[s.metaLabel, { marginTop: 8 }]}>DATE</Text>
            <Text style={s.metaValue}>{data.date || "—"}</Text>
          </View>
        </View>

        {/* ---------------- Items table -------------------------------------- */}
        <View style={s.table}>
          <View style={s.th}>
            <Text style={[s.thCell, s.center, { width: COL.num }]}>#</Text>
            <Text style={[s.thCell, { width: COL.desc }]}>DESCRIPTION</Text>
            <Text style={[s.thCell, s.center, { width: COL.unit }]}>UNIT</Text>
            <Text style={[s.thCell, s.center, { width: COL.qty }]}>QTY</Text>
            <Text style={[s.thCell, s.right, { width: COL.rate }]}>
              RATE (₹)
            </Text>
            <Text style={[s.thCell, s.center, { width: COL.hsn }]}>HSN</Text>
            <Text style={[s.thCell, s.center, { width: COL.gst }]}>GST</Text>
          </View>

          {data.items.map((item, i) => (
            <View
              key={item.id}
              wrap={false}
              style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr}
            >
              <Text style={[s.td, s.tdText, s.center, { width: COL.num }]}>
                {formatSerial(i)}
              </Text>
              <DescriptionCell description={item.description} />
              <Text style={[s.td, s.tdText, s.center, { width: COL.unit }]}>
                {item.unit.trim() || "—"}
              </Text>
              <Text style={[s.td, s.tdText, s.center, { width: COL.qty }]}>
                {formatQty(item.qty)}
              </Text>
              <Text style={[s.td, s.tdText, s.right, { width: COL.rate }]}>
                {formatINR(item.rate)}
              </Text>
              <Text style={[s.td, s.tdText, s.center, { width: COL.hsn }]}>
                {item.hsn.trim() || "—"}
              </Text>
              <Text style={[s.td, s.tdText, s.center, { width: COL.gst }]}>
                {item.gst.trim() || "—"}
              </Text>
            </View>
          ))}

          {/* Optional summary rows: base total + GST, kept separate */}
          {totals && (
            <>
              <SummaryRow label="TOTAL (₹)" value={totals.base} first />
              <SummaryRow label="GST (₹)" value={totals.gst} />
            </>
          )}
        </View>

        {/* ---------------- Terms & conditions --------------------------------- */}
        <View>
          <Text style={s.termsHeading}>TERMS &amp; CONDITIONS</Text>
          {COMPANY.terms.map((t, i) => (
            <View key={t.title} style={s.termRow}>
              <Text style={s.termNum}>{formatSerial(i)}</Text>
              <Text style={s.termText}>
                <Text style={{ fontWeight: 700 }}>{t.title}</Text> — {t.body}
              </Text>
            </View>
          ))}
        </View>

        {/* ---------------- Sign-off message (left-aligned) --------------------- */}
        <Text style={s.signOff}>
          {COMPANY.closingNote[0]}
          {"\n"}
          {COMPANY.closingNote[1]}
        </Text>

        {/* ------- Authorised signatory (left) + bank details (very bottom) ------- */}
        {/* Grouped in one non-breaking container so they never split across pages */}
        <View wrap={false}>
          <View style={s.signatoryBlock}>
            <Image src="/shantanu_stamp-removebg-preview.png" style={s.stamp} />
            <Text style={s.signatoryLabel}>Authorised signatory</Text>
            <Text style={s.signatoryName}>{COMPANY.name}</Text>
            <Text style={s.signatoryLine}>{COMPANY.address}</Text>
            <Text style={s.signatoryLine}>{COMPANY.phone}</Text>
            <Text style={s.signatoryLine}>GST NO: {COMPANY.gst}</Text>
            <Text style={s.signatoryEmail}>{COMPANY.email}</Text>
          </View>

          {data.showBankDetails && (
            <View style={s.bankBox}>
              <Text style={[s.metaLabel, { marginBottom: 6 }]}>
                BANK DETAILS
              </Text>
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Bank Name</Text>
                <Text style={s.bankValue}>{COMPANY.bank.name}</Text>
              </View>
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Account No.</Text>
                <Text style={s.bankValue}>{COMPANY.bank.account}</Text>
              </View>
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>IFSC Code</Text>
                <Text style={s.bankValue}>{COMPANY.bank.ifsc}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ---------------- Fixed footer with page numbers ------------------------ */}
        <View style={s.pageFooter} fixed>
          <Text
            style={s.pageFooterText}
            render={({ pageNumber, totalPages }) =>
              `Shantanu Enterprises  ·  Pirangut, Pune  ·  ${COMPANY.website}  ·  Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
