import connectDB from "@/lib/db";
import Bill from "@/lib/models/Bill";
import { requireAuth, canAccess } from "@/lib/auth";
import { slDayRangeUtc, slMonthRangeUtc, todaySLKey, currentMonthSLKey, SL_TZ } from "@/lib/utils/timezone";
import { ok, fail, withErrorHandler } from "@/lib/utils/apiResponse";

function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "summary")) return { error: "Not allowed", status: 403 };
  return { session };
}

/**
 * GET /api/admin/summary?scope=daily&date=yyyy-MM-dd
 * GET /api/admin/summary?scope=monthly&month=yyyy-MM
 *
 * Aggregates POS bill line items over the range, grouped per item, giving:
 *   qty sold, income (after discount) and profit — plus grand totals.
 * Monthly also returns a per-day income series for the graph.
 * All day boundaries are Sri-Lanka-local.
 */
async function handler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const sp = new URL(req.url).searchParams;
  const scope = sp.get("scope") === "monthly" ? "monthly" : "daily";

  const { start, end } =
    scope === "monthly"
      ? slMonthRangeUtc(sp.get("month") || currentMonthSLKey())
      : slDayRangeUtc(sp.get("date") || todaySLKey());

  const match = { createdAt: { $gte: start, $lt: end } };

  // Income per line = sellingPrice * qty - itemDiscount.
  const lineIncome = {
    $subtract: [{ $multiply: ["$items.sellingPrice", "$items.qty"] }, { $ifNull: ["$items.itemDiscount", 0] }],
  };

  // Per-item rows.
  const rows = await Bill.aggregate([
    { $match: match },
    { $unwind: "$items" },
    {
      $group: {
        _id: { kind: "$items.kind", ref: "$items.ref", name: "$items.name" },
        qty: { $sum: "$items.qty" },
        income: { $sum: lineIncome },
        profit: { $sum: { $ifNull: ["$items.profitAfter", 0] } },
      },
    },
    { $sort: { income: -1 } },
  ]);

  const items = rows.map((r) => ({
    kind: r._id.kind,
    name: r._id.name,
    qty: r.qty,
    income: round2(r.income),
    profit: round2(r.profit),
  }));

  const grandIncome = round2(items.reduce((s, i) => s + i.income, 0));
  const grandProfit = round2(items.reduce((s, i) => s + i.profit, 0));

  // Monthly per-day income series for the bar chart.
  let series = [];
  if (scope === "monthly") {
    series = await Bill.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: SL_TZ } },
          income: { $sum: lineIncome },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    series = series.map((s) => ({ date: s._id, income: round2(s.income) }));
  }

  return ok({ scope, items, grandIncome, grandProfit, series });
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export const GET = withErrorHandler(handler);
