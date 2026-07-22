"use client";

import { formatRs } from "@/lib/utils/currency";
import { formatSL } from "@/lib/utils/timezone";

/**
 * Full customer statement, rendered in two hidden print blocks:
 *   #invoice-a4     — A4 page
 *   #statement-80   — 80mm thermal
 * Both are shown only when their body print-class is active (see globals.css).
 * Includes every credit bill's items (with dress variant + bring/deliver dates),
 * auto-calculated delay charges, totals and payment history.
 */
export default function CustomerStatement({ data, salon }) {
  if (!data) return null;
  const { customer, creditBills = [], reservations = [], history = [], billBalance = 0, delayTotal = 0, balanceDue = 0 } = data;
  const name = salon?.salonName || salon?.name || "Salon";
  const unsettled = creditBills.filter((b) => (b.balance || 0) > 0.009);
  const billsToPrint = unsettled.length > 0 ? unsettled : creditBills.slice(0, 2);

  return (
    <>
      {/* ---------- A4 ---------- */}
      <div id="invoice-a4" className="hidden bg-white p-8 text-gray-900 print:block" style={{ fontFamily: "Arial, sans-serif" }}>
        <div className="flex items-start justify-between border-b border-gray-300 pb-4">
          <div className="flex items-center gap-3">
            {salon?.logo?.url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={salon.logo.url} alt="" className="h-16 w-16 rounded-full object-cover" />
            )}
            <div>
              <h1 className="text-2xl font-bold">{name}</h1>
              {salon?.addressLine1 && <p className="text-sm text-gray-500">{salon.addressLine1}</p>}
              {salon?.addressLine2 && <p className="text-sm text-gray-500">{salon.addressLine2}</p>}
              {salon?.phone && <p className="text-sm text-gray-500">Tel: {salon.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">INVOICE</h2>
            <p className="text-sm text-gray-500">{formatSL(new Date(), "yyyy-MM-dd")}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-500">Bill to</p>
          <p className="font-semibold">{customer.name}</p>
          <p className="text-sm text-gray-600">{customer.phone}{customer.idCard ? ` · ID: ${customer.idCard}` : ""}</p>
          {(customer.addressLine1 || customer.addressLine2) && (
            <p className="text-sm text-gray-600">{[customer.addressLine1, customer.addressLine2].filter(Boolean).join(", ")}</p>
          )}
        </div>

        {billsToPrint.map((b) => (
          <div key={b._id} className="mt-5">
            <p className="mb-1 text-sm font-semibold">Bill {b.billId} · {formatSL(b.createdAt, "yyyy-MM-dd")}</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-left text-gray-500">
                  <th className="py-1">Item</th><th className="py-1 text-center">Qty</th><th className="py-1 text-right">Price</th><th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {b.items.map((it, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1">
                      {it.name}
                      {it.kind === "dressjewelry" && it.bringDate && (
                        <span className="block text-xs text-gray-500">Bring {it.bringDate} → Deliver {it.deliverDate}</span>
                      )}
                    </td>
                    <td className="py-1 text-center">{it.qty}</td>
                    <td className="py-1 text-right">{formatRs(it.sellingPrice, 0)}</td>
                    <td className="py-1 text-right">{formatRs(it.sellingPrice * it.qty, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-1 flex justify-end text-sm">
              <span className="mr-6 text-gray-500">Total {formatRs(b.grandTotal)}</span>
              <span className="mr-6 text-gray-500">Paid {formatRs(b.paidAmount)}</span>
              <span className="font-semibold">Balance {formatRs(b.balance)}</span>
            </div>
          </div>
        ))}

        {reservations.some((r) => r.delayCharge > 0) && (
          <div className="mt-5">
            <p className="mb-1 text-sm font-semibold text-red-600">Delay charges</p>
            <table className="w-full text-sm">
              <tbody>
                {reservations.filter((r) => r.delayCharge > 0).map((r, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1">{r.name} ({r.variantName}) · due {r.deliverDate} · {r.overdueDays} day(s) late × {formatRs(r.delayChargePerDay, 0)} × {r.qty}</td>
                    <td className="py-1 text-right">{formatRs(r.delayCharge, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 ml-auto w-64 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Bills balance</span><span>{formatRs(billBalance)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Delay charges</span><span>{formatRs(delayTotal)}</span></div>
          <div className="mt-1 flex justify-between border-t border-gray-300 pt-1 text-base font-bold"><span>Balance due</span><span>{formatRs(balanceDue)}</span></div>
        </div>
      </div>

      {/* ---------- 80mm ---------- */}
      <div id="statement-80" className="hidden bg-white p-2 text-black print:block" style={{ width: "80mm", fontFamily: "monospace", fontSize: "13px" }}>
        <div className="text-center">
          {salon?.logo?.url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={salon.logo.url} alt="" className="mx-auto mb-1 h-14 w-14 rounded-full object-cover" />
          )}
          <p className="text-lg font-bold">{name}</p>
          <p>Customer statement</p>
          <p>{customer.name} · {customer.phone}</p>
          <p>{formatSL(new Date(), "yyyy-MM-dd")}</p>
        </div>
        <div className="my-1 border-t border-dashed border-black" />
        {billsToPrint.map((b) => (
          <div key={b._id} className="mb-1">
            <p className="font-bold">{b.billId}</p>
            {b.items.map((it, i) => (
              <div key={i} className="flex justify-between">
                <span>{it.name} x{it.qty}{it.kind === "dressjewelry" && it.deliverDate ? ` (ret ${it.deliverDate})` : ""}</span>
                <span>{formatRs(it.sellingPrice * it.qty, 0)}</span>
              </div>
            ))}
            <div className="flex justify-between"><span>Paid/Bal</span><span>{formatRs(b.paidAmount, 0)}/{formatRs(b.balance, 0)}</span></div>
          </div>
        ))}
        <div className="my-1 border-t border-dashed border-black" />
        <div className="flex justify-between"><span>Bills balance</span><span>{formatRs(billBalance, 0)}</span></div>
        <div className="flex justify-between"><span>Delay charges</span><span>{formatRs(delayTotal, 0)}</span></div>
        <div className="flex justify-between font-bold"><span>Balance due</span><span>{formatRs(balanceDue, 0)}</span></div>
      </div>
    </>
  );
}
