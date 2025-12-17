'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type PurchaseOrderDetailsModalProps = {
  po: any;
  onClose: () => void;
  title?: string;
};

function formatDate(value: any) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
}

function num(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safeParseJson(value: any) {
  if (!value || typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

type ItemColKey =
  | 'sr'
  | 'partNo'
  | 'item'
  | 'brand'
  | 'uom'
  | 'receivedQty'
  | 'rack'
  | 'shelf'
  | 'purchasePrice'
  | 'amount'
  | 'costPercent'
  | 'cost'
  | 'costUnit'
  | 'remarks';

export default function PurchaseOrderDetailsModal({
  po,
  onClose,
  title = 'Purchase Order Details',
}: PurchaseOrderDetailsModalProps) {
  const receiveData =
    (typeof (po as any)?.receiveData === 'string' ? safeParseJson((po as any)?.receiveData) : (po as any)?.receiveData) || {};
  const store =
    receiveData?.storeName ||
    receiveData?.store?.name ||
    receiveData?.store ||
    (po as any)?.store ||
    '-';

  const items: any[] = Array.isArray(receiveData?.items) && receiveData.items.length > 0 ? receiveData.items : (po?.items || []);
  const expenses: any[] = Array.isArray(receiveData?.expenses) ? receiveData.expenses : [];

  const currency = receiveData?.currency || 'PKR';
  const totals = receiveData?.totals || {};

  const computedTotalAmount =
    num(totals?.total) ||
    items.reduce((sum, it) => sum + num(it?.amount ?? it?.totalPrice ?? 0), 0);
  const computedDiscount = num(receiveData?.discount ?? po?.discount ?? 0);
  const computedGrandTotal =
    num(po?.totalAmount) ||
    (num(totals?.totalAfterDiscount) || (computedTotalAmount - computedDiscount));
  const computedTotalExpenses =
    num(totals?.totalExpenses) ||
    expenses.reduce((sum, e) => sum + num(e?.amount ?? 0), 0);

  const itemCols = useMemo(() => {
    return [
      { key: 'sr' as const, label: 'Sr. No.', get: (_it: any, idx: number) => String(idx + 1) },
      { key: 'partNo' as const, label: 'OEM/Part No', get: (it: any) => String(it?.partNo ?? '-') },
      {
        key: 'item' as const,
        label: 'Item',
        get: (it: any) => String(it?.description ?? it?.part?.description ?? it?.partName ?? '-'),
      },
      { key: 'brand' as const, label: 'Brand', get: (it: any) => String(it?.brand ?? it?.part?.brand ?? '-') },
      { key: 'uom' as const, label: 'Uom', get: (it: any) => String(it?.uom ?? '-') },
      {
        key: 'receivedQty' as const,
        label: 'Received Qty',
        get: (it: any) => {
          const receivedQty = num(it?.receivedQty ?? it?.quantity ?? 0);
          return receivedQty ? receivedQty.toLocaleString() : '-';
        },
      },
      { key: 'rack' as const, label: 'Rack', get: (it: any) => String(it?.rackNo ?? it?.rack ?? '-') },
      { key: 'shelf' as const, label: 'Shelf', get: (it: any) => String(it?.shelfNo ?? it?.shelf ?? '-') },
      {
        key: 'purchasePrice' as const,
        label: 'Purchase Price',
        get: (it: any) => {
          const receivedQty = num(it?.receivedQty ?? it?.quantity ?? 0);
          const purchasePrice =
            num(it?.purchasePricePKR) ||
            num(it?.unitPrice) * num(receiveData?.currencyRate || 1) ||
            num(it?.unitPrice);
          const cost = num(it?.costPKR) || num(it?.cost) || receivedQty * purchasePrice;
          const amount = num(it?.amount) || num(it?.totalPrice) || cost;
          // If received data exists, purchase price is usually PKR; otherwise show unitPrice
          const val = num(it?.purchasePricePKR) || num(it?.unitPrice) || 0;
          return val ? val.toLocaleString() : (amount ? amount.toLocaleString() : '-');
        },
      },
      {
        key: 'amount' as const,
        label: 'Amount',
        get: (it: any) => {
          const receivedQty = num(it?.receivedQty ?? it?.quantity ?? 0);
          const purchasePrice =
            num(it?.purchasePricePKR) ||
            num(it?.unitPrice) * num(receiveData?.currencyRate || 1) ||
            num(it?.unitPrice);
          const cost = num(it?.costPKR) || num(it?.cost) || receivedQty * purchasePrice;
          const amount = num(it?.amount) || num(it?.totalPrice) || cost;
          return amount ? amount.toLocaleString() : '-';
        },
      },
      { key: 'costPercent' as const, label: 'Cost %', get: (it: any) => String(it?.costPercent ?? '-') },
      {
        key: 'cost' as const,
        label: 'Cost',
        get: (it: any) => {
          const receivedQty = num(it?.receivedQty ?? it?.quantity ?? 0);
          const purchasePrice =
            num(it?.purchasePricePKR) ||
            num(it?.unitPrice) * num(receiveData?.currencyRate || 1) ||
            num(it?.unitPrice);
          const cost = num(it?.costPKR) || num(it?.cost) || receivedQty * purchasePrice;
          return cost ? cost.toLocaleString() : '-';
        },
      },
      {
        key: 'costUnit' as const,
        label: 'Cost/Unit',
        get: (it: any) => {
          const receivedQty = num(it?.receivedQty ?? it?.quantity ?? 0);
          const purchasePrice =
            num(it?.purchasePricePKR) ||
            num(it?.unitPrice) * num(receiveData?.currencyRate || 1) ||
            num(it?.unitPrice);
          const cost = num(it?.costPKR) || num(it?.cost) || receivedQty * purchasePrice;
          const costPerUnit = receivedQty > 0 ? cost / receivedQty : 0;
          return costPerUnit ? costPerUnit.toLocaleString() : '-';
        },
      },
      { key: 'remarks' as const, label: 'Remarks', get: (it: any) => String(it?.remarks ?? it?.note ?? '-') },
    ];
  }, [receiveData?.currencyRate]);

  const [selectedCols, setSelectedCols] = useState<Record<ItemColKey, boolean>>({
    sr: true,
    partNo: true,
    item: true,
    brand: true,
    uom: true,
    receivedQty: true,
    rack: true,
    shelf: true,
    purchasePrice: true,
    amount: true,
    costPercent: true,
    cost: true,
    costUnit: true,
    remarks: true,
  });
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handlePrint = () => {
    if (typeof window === 'undefined') return;
    const heading = 'Purchase Invoice';

    const selected = itemCols.filter(c => selectedCols[c.key]);
    const headerCells = selected.map(c => `<th>${c.label}</th>`).join('');

    const itemRows = (items || [])
      .map((it: any, idx: number) => {
        const tds = selected
          .map(c => {
            const v = c.get(it, idx);
            return `<td>${String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</td>`;
          })
          .join('');
        return `<tr>${tds}</tr>`;
      })
      .join('');

    const expenseRows = (expenses || [])
      .map((ex: any, idx: number) => {
        const cols = [
          String(idx + 1),
          String(ex?.name ?? ex?.expense ?? '-'),
          String(ex?.payableAccount ?? ex?.account ?? '-'),
          String(ex?.description ?? '-'),
          num(ex?.amount).toLocaleString(),
        ];
        const tds = cols.map(v => `<td>${v.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</td>`).join('');
        return `<tr>${tds}</tr>`;
      })
      .join('');

    const html = `
      <html>
        <head>
          <title>${heading} - ${po?.poNo ?? ''}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: Arial, sans-serif; margin: 18px; color: #111827; }
            h2 { margin: 0 0 4px 0; font-size: 18px; }
            .muted { color: #6b7280; font-size: 12px; margin-bottom: 12px; }
            .box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
            .meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px 14px; font-size: 12px; margin-bottom: 12px; }
            .meta div b { font-weight: 700; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 8px; font-size: 11px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; font-weight: 700; }
            .totals { margin-top: 12px; display: grid; gap: 6px; justify-items: end; font-size: 12px; }
            .sectionTitle { margin: 14px 0 8px 0; font-size: 13px; font-weight: 700; color: #374151; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h2>${heading}</h2>
          <div class="muted">PO No.: ${String(po?.poNo ?? '-')}</div>
          <div class="box">
            <div class="meta">
              <div><b>Supplier:</b> ${String(po?.supplierName ?? '-')}</div>
              <div><b>Store:</b> ${String(store)}</div>
              <div><b>Date:</b> ${String(formatDate(po?.orderDate))}</div>
              <div><b>PO No:</b> ${String(po?.poNo ?? '-')}</div>
              <div><b>Remarks:</b> ${String(po?.notes ?? '-')}</div>
              <div><b>Status:</b> ${String(po?.status ?? '-')}</div>
            </div>

            <div class="sectionTitle">Items</div>
            <table>
              <thead><tr>${headerCells}</tr></thead>
              <tbody>${itemRows || `<tr><td colspan="${selected.length}">No items found.</td></tr>`}</tbody>
            </table>

            <div class="totals">
              <div><b>Total Amount:</b> ${currency} ${computedTotalAmount.toLocaleString()}</div>
              <div><b>Discount:</b> ${currency} ${computedDiscount.toLocaleString()}</div>
              <div><b>Grand Total:</b> ${currency} ${computedGrandTotal.toLocaleString()}</div>
            </div>

            <div class="sectionTitle">Expenses</div>
            <table>
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Expenses</th>
                  <th>Payable Account</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>${expenseRows || `<tr><td colspan="5">No expenses found.</td></tr>`}</tbody>
            </table>
            <div class="totals">
              <div><b>Total Expenses:</b> ${currency} ${computedTotalExpenses.toLocaleString()}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Print via hidden iframe so it prints ONLY invoice (no full page) and avoids popup blockers.
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    }, 500);
  };

  const handleGeneratePdf = async () => {
    if (typeof window === 'undefined') return;
    try {
      setPdfLoading(true);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl('');
      setPdfName('');

      const heading = 'Purchase Invoice';
      const selected = itemCols.filter(c => selectedCols[c.key]);
      const headers = selected.map(c => c.label);
      const body = (items || []).map((it: any, idx: number) => selected.map(c => String(c.get(it, idx) ?? '')));

      const { jsPDF } = await import('jspdf');
      const autoTableMod: any = await import('jspdf-autotable');
      const autoTable = autoTableMod.default || autoTableMod;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

      const poNo = String(po?.poNo ?? '-');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(heading, 40, 34);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(
        `PO No.: ${poNo}   |   Supplier: ${String(po?.supplierName ?? '-')}   |   Store: ${String(
          store
        )}   |   Date: ${String(formatDate(po?.orderDate))}   |   Status: ${String(po?.status ?? '-')}`,
        40,
        54
      );

      autoTable(doc, {
        head: [headers],
        body,
        startY: 70,
        styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
        headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 40, right: 40 },
      });

      const y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 14 : 560;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Total Amount: ${currency} ${computedTotalAmount.toLocaleString()}`, 40, y);
      doc.text(`Discount: ${currency} ${computedDiscount.toLocaleString()}`, 40, y + 14);
      doc.text(`Grand Total: ${currency} ${computedGrandTotal.toLocaleString()}`, 40, y + 28);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Expenses: ${currency} ${computedTotalExpenses.toLocaleString()}`, 40, y + 42);

      const fileName = `Invoice-${poNo}.pdf`;
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfName(fileName);
      setPdfUrl(url);
    } catch (e) {
      console.error('PDF generation failed:', e);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/40 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-[min(98vw,90rem)] max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-3 py-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-cyan-50 border border-cyan-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
              <div className="text-xs text-gray-500 mt-0.5">PO No.: {po?.poNo ?? '-'}</div>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="h-8 w-8 px-0">
            ✕
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto po-details-scroll">
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @media (max-width: 768px) {
                  .po-details-scroll::-webkit-scrollbar { display: none; }
                  .po-details-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                }

                /* Print helpers */
                .po-print-only { display: none; }
                @media print {
                  .po-screen-only { display: none !important; }
                  .po-print-only { display: block !important; }
                }

                /* Hide horizontal scrollbar (keep horizontal scroll working) */
                .po-xscroll::-webkit-scrollbar { display: none; height: 0; }
                .po-xscroll { -ms-overflow-style: none; scrollbar-width: none; }
              `,
            }}
          />

          {/* Admin column selector (screen-only) */}
          <div className="po-screen-only mb-3">
            <div className="border border-gray-200 rounded-md bg-white p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-sm font-semibold text-gray-900">Print Column Selection</div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next: any = {};
                      itemCols.forEach(c => (next[c.key] = true));
                      setSelectedCols(next);
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next: any = {};
                      itemCols.forEach(c => (next[c.key] = false));
                      setSelectedCols(next);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {itemCols.map(col => (
                  <label key={col.key} className="flex items-center gap-2 text-xs text-gray-700 select-none">
                    <input
                      type="checkbox"
                      checked={!!selectedCols[col.key]}
                      onChange={(e) => setSelectedCols(prev => ({ ...prev, [col.key]: e.target.checked }))}
                    />
                    <span className="truncate">{col.label}</span>
                  </label>
                ))}
              </div>
              <div className="text-[11px] text-gray-500 mt-2">
                Tip: Select the columns you want, then click <b>PRINT</b>. It will print only the invoice tables.
              </div>
            </div>
          </div>

          {/* Print area (re-used for printing) */}
          <div id="po-print-area" className="space-y-4 sm:space-y-5">
            {/* Outer bordered content box (matches screenshot style) */}
            <div className="border border-gray-200 rounded-md bg-white p-3 sm:p-4">
              {/* Summary row (inline label:value like screenshot) */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4 text-sm mb-3">
                <div className="min-w-0">
                  <span className="font-semibold">Supplier:</span>{' '}
                  <span className="font-semibold break-words">{po?.supplierName ?? '-'}</span>
                </div>
                <div className="min-w-0">
                  <span className="font-semibold">Store:</span>{' '}
                  <span className="font-semibold break-words">{store}</span>
                </div>
                <div className="min-w-0">
                  <span className="font-semibold">Date:</span>{' '}
                  <span className="font-semibold">{formatDate(po?.orderDate)}</span>
                </div>
                <div className="min-w-0">
                  <span className="font-semibold">PO No:</span>{' '}
                  <span className="font-semibold break-words">{po?.poNo ?? '-'}</span>
                </div>
                <div className="min-w-0">
                  <span className="font-semibold">Remarks:</span>{' '}
                  <span className="font-semibold break-words">{po?.notes ?? '-'}</span>
                </div>
                <div className="min-w-0">
                  <span className="font-semibold">Status :</span>{' '}
                  <span className="font-semibold capitalize break-words">{po?.status ?? '-'}</span>
                </div>
              </div>

              {/* Items table */}
              <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
              {/* Desktop/tablet view (table) */}
              <div className="hidden lg:block">
                <div className="w-full overflow-x-auto po-xscroll">
                <table className="w-full text-sm min-w-[1200px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Sr. No.</th>
                      <th className="px-4 py-3">OEM/Part No</th>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Brand</th>
                      <th className="px-4 py-3">Uom</th>
                      <th className="px-4 py-3">Received Quantity</th>
                      <th className="px-4 py-3">Rack</th>
                      <th className="px-4 py-3">Shelf</th>
                      <th className="px-4 py-3">Purchase Price</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Cost %</th>
                      <th className="px-4 py-3">Cost</th>
                      <th className="px-4 py-3">Cost/Unit</th>
                      <th className="px-4 py-3 rounded-r-xl">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td className="px-4 py-4 text-gray-500" colSpan={14}>
                          No items found.
                        </td>
                      </tr>
                    ) : (
                      items.map((it: any, idx: number) => {
                        const receivedQty = num(it?.receivedQty ?? it?.quantity ?? 0);
                        const purchasePrice =
                          num(it?.purchasePricePKR) ||
                          num(it?.unitPrice) * num(receiveData?.currencyRate || 1) ||
                          num(it?.unitPrice);
                        const cost = num(it?.costPKR) || num(it?.cost) || receivedQty * purchasePrice;
                        const amount = num(it?.amount) || num(it?.totalPrice) || cost;
                        const costPerUnit = receivedQty > 0 ? cost / receivedQty : 0;

                        return (
                          <tr key={idx} className="border-t border-gray-200">
                            <td className="px-4 py-3">{idx + 1}</td>
                            <td className="px-4 py-3 break-words min-w-[160px]">{it?.partNo ?? '-'}</td>
                            <td className="px-4 py-3 break-words min-w-[180px]">
                              {it?.description ?? it?.part?.description ?? it?.partName ?? '-'}
                            </td>
                            <td className="px-4 py-3 break-words">{it?.brand ?? it?.part?.brand ?? '-'}</td>
                            <td className="px-4 py-3">{it?.uom ?? '-'}</td>
                            <td className="px-4 py-3">{receivedQty || '-'}</td>
                            <td className="px-4 py-3 break-words">{it?.rackNo ?? it?.rack ?? '-'}</td>
                            <td className="px-4 py-3 break-words">{it?.shelfNo ?? it?.shelf ?? '-'}</td>
                            <td className="px-4 py-3">{purchasePrice ? purchasePrice.toLocaleString() : '-'}</td>
                            <td className="px-4 py-3">{amount ? amount.toLocaleString() : '-'}</td>
                            <td className="px-4 py-3">{it?.costPercent ?? '-'}</td>
                            <td className="px-4 py-3">{cost ? cost.toLocaleString() : '-'}</td>
                            <td className="px-4 py-3">{costPerUnit ? costPerUnit.toLocaleString() : '-'}</td>
                            <td className="px-4 py-3 break-words min-w-[140px]">
                              {it?.remarks ?? it?.note ?? '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Mobile view (cards) - show ALL fields without horizontal scroll */}
              <div className="block lg:hidden po-screen-only">
                <div className="divide-y divide-gray-200">
                  {items.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500">No items found.</div>
                  ) : (
                    items.map((it: any, idx: number) => {
                      const receivedQty = num(it?.receivedQty ?? it?.quantity ?? 0);
                      const purchasePrice =
                        num(it?.purchasePricePKR) ||
                        num(it?.unitPrice) * num(receiveData?.currencyRate || 1) ||
                        num(it?.unitPrice);
                      const cost = num(it?.costPKR) || num(it?.cost) || receivedQty * purchasePrice;
                      const amount = num(it?.amount) || num(it?.totalPrice) || cost;
                      const costPerUnit = receivedQty > 0 ? cost / receivedQty : 0;

                      const pairs: Array<[string, any]> = [
                        ['Sr. No.', idx + 1],
                        ['OEM/Part No', it?.partNo ?? '-'],
                        ['Item', it?.description ?? it?.part?.description ?? it?.partName ?? '-'],
                        ['Brand', it?.brand ?? it?.part?.brand ?? '-'],
                        ['Uom', it?.uom ?? '-'],
                        ['Received Qty', receivedQty || '-'],
                        ['Rack', it?.rackNo ?? it?.rack ?? '-'],
                        ['Shelf', it?.shelfNo ?? it?.shelf ?? '-'],
                        ['Purchase Price', purchasePrice ? purchasePrice.toLocaleString() : '-'],
                        ['Amount', amount ? amount.toLocaleString() : '-'],
                        ['Cost %', it?.costPercent ?? '-'],
                        ['Cost', cost ? cost.toLocaleString() : '-'],
                        ['Cost/Unit', costPerUnit ? costPerUnit.toLocaleString() : '-'],
                        ['Remarks', it?.remarks ?? it?.note ?? '-'],
                      ];

                      return (
                        <div key={idx} className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            {pairs.map(([k, v]) => (
                              <div key={k} className="min-w-0">
                                <div className="text-[11px] text-gray-500">{k}</div>
                                <div className="font-medium break-words">{String(v)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Print-only: always use the table */}
              <div className="po-print-only">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2">Sr. No.</th>
                      <th className="px-3 py-2">OEM/Part No</th>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Brand</th>
                      <th className="px-3 py-2">Uom</th>
                      <th className="px-3 py-2">Received Qty</th>
                      <th className="px-3 py-2">Rack</th>
                      <th className="px-3 py-2">Shelf</th>
                      <th className="px-3 py-2">Purchase Price</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Cost %</th>
                      <th className="px-3 py-2">Cost</th>
                      <th className="px-3 py-2">Cost/Unit</th>
                      <th className="px-3 py-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(items || []).map((it: any, idx: number) => {
                      const receivedQty = num(it?.receivedQty ?? it?.quantity ?? 0);
                      const purchasePrice =
                        num(it?.purchasePricePKR) ||
                        num(it?.unitPrice) * num(receiveData?.currencyRate || 1) ||
                        num(it?.unitPrice);
                      const cost = num(it?.costPKR) || num(it?.cost) || receivedQty * purchasePrice;
                      const amount = num(it?.amount) || num(it?.totalPrice) || cost;
                      const costPerUnit = receivedQty > 0 ? cost / receivedQty : 0;
                      return (
                        <tr key={idx} className="border-t border-gray-200">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{it?.partNo ?? '-'}</td>
                          <td className="px-3 py-2">{it?.description ?? it?.part?.description ?? it?.partName ?? '-'}</td>
                          <td className="px-3 py-2">{it?.brand ?? it?.part?.brand ?? '-'}</td>
                          <td className="px-3 py-2">{it?.uom ?? '-'}</td>
                          <td className="px-3 py-2">{receivedQty || '-'}</td>
                          <td className="px-3 py-2">{it?.rackNo ?? it?.rack ?? '-'}</td>
                          <td className="px-3 py-2">{it?.shelfNo ?? it?.shelf ?? '-'}</td>
                          <td className="px-3 py-2">{purchasePrice ? purchasePrice.toLocaleString() : '-'}</td>
                          <td className="px-3 py-2">{amount ? amount.toLocaleString() : '-'}</td>
                          <td className="px-3 py-2">{it?.costPercent ?? '-'}</td>
                          <td className="px-3 py-2">{cost ? cost.toLocaleString() : '-'}</td>
                          <td className="px-3 py-2">{costPerUnit ? costPerUnit.toLocaleString() : '-'}</td>
                          <td className="px-3 py-2">{it?.remarks ?? it?.note ?? '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 flex flex-col items-end gap-1">
                <div className="text-sm font-semibold">
                  Total Amount: {currency} {computedTotalAmount.toLocaleString()}
                </div>
                <div className="text-sm font-semibold">
                  Discount : {currency} {computedDiscount.toLocaleString()}
                </div>
                <div className="text-sm font-semibold">
                  Grand Total:{currency} {computedGrandTotal.toLocaleString()}
                </div>
              </div>
              </div>

              {/* Expenses */}
              <div className="border border-gray-200 rounded-xl bg-white overflow-hidden mt-4">
              {/* Desktop/tablet view (table) */}
              <div className="hidden lg:block">
                <div className="w-full overflow-x-auto po-xscroll">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Sr. No.</th>
                      <th className="px-4 py-3">Expenses</th>
                      <th className="px-4 py-3">Payable Account</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 rounded-r-xl">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr>
                        <td className="px-4 py-4 text-gray-500" colSpan={5}>
                          No expenses found.
                        </td>
                      </tr>
                    ) : (
                      expenses.map((ex: any, idx: number) => (
                        <tr key={idx} className="border-t border-gray-200">
                          <td className="px-4 py-3">{idx + 1}</td>
                          <td className="px-4 py-3 break-words">{ex?.name ?? ex?.expense ?? '-'}</td>
                          <td className="px-4 py-3 break-words">{ex?.payableAccount ?? ex?.account ?? '-'}</td>
                          <td className="px-4 py-3 break-words">{ex?.description ?? '-'}</td>
                          <td className="px-4 py-3">{num(ex?.amount).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Mobile view (cards) */}
              <div className="block lg:hidden po-screen-only">
                <div className="divide-y divide-gray-200">
                  {expenses.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500">No expenses found.</div>
                  ) : (
                    expenses.map((ex: any, idx: number) => {
                      const pairs: Array<[string, any]> = [
                        ['Sr. No.', idx + 1],
                        ['Expenses', ex?.name ?? ex?.expense ?? '-'],
                        ['Payable Account', ex?.payableAccount ?? ex?.account ?? '-'],
                        ['Description', ex?.description ?? '-'],
                        ['Amount', num(ex?.amount).toLocaleString()],
                      ];
                      return (
                        <div key={idx} className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            {pairs.map(([k, v]) => (
                              <div key={k} className="min-w-0">
                                <div className="text-[11px] text-gray-500">{k}</div>
                                <div className="font-medium break-words">{String(v)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Print-only: table */}
              <div className="po-print-only">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2">Sr. No.</th>
                      <th className="px-3 py-2">Expenses</th>
                      <th className="px-3 py-2">Payable Account</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(expenses || []).map((ex: any, idx: number) => (
                      <tr key={idx} className="border-t border-gray-200">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{ex?.name ?? ex?.expense ?? '-'}</td>
                        <td className="px-3 py-2">{ex?.payableAccount ?? ex?.account ?? '-'}</td>
                        <td className="px-3 py-2">{ex?.description ?? '-'}</td>
                        <td className="px-3 py-2">{num(ex?.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 flex justify-end text-sm font-semibold">
                Total Expenses={currency} {computedTotalExpenses.toLocaleString()}
              </div>
              </div>
            </div>
          </div>

        </CardContent>

        {/* Sticky footer actions (always visible) */}
        <div className="border-t bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-sm text-primary-600">
              ⓧ Close
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePdf}
                disabled={pdfLoading}
                className="border-primary-300 text-primary-700 hover:bg-primary-50"
              >
                {pdfLoading ? 'Generating...' : 'Generate PDF'}
              </Button>
              <Button type="button" onClick={handlePrint} className="bg-purple-700 hover:bg-purple-800">
                PRINT
              </Button>
            </div>
          </div>

          {pdfUrl && (
            <div className="mt-2 flex items-center justify-end gap-2 text-sm">
              <a className="underline text-primary-700 hover:text-primary-800" href={pdfUrl} target="_blank" rel="noreferrer">
                Open PDF
              </a>
              <span className="text-gray-400">|</span>
              <a className="underline text-primary-700 hover:text-primary-800" href={pdfUrl} download={pdfName || 'invoice.pdf'}>
                Download PDF
              </a>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}


