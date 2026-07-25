import connectDB from "@/lib/db";
import Service from "@/lib/models/Service";
import Package from "@/lib/models/Package";
import Booking from "@/lib/models/Booking";
import Holiday from "@/lib/models/Holiday";
import { nextId } from "@/lib/utils/idGenerator";
import { smsService } from "@/lib/services/SmsService";
import { getSettings } from "@/lib/settings";
import { todaySLKey, dateKey } from "@/lib/utils/timezone";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";

/**
 * POST /api/bookings — customer books a SERVICE or PACKAGE.
 * Body: { itemType, itemId, customer:{firstName,lastName,phone,gender}, date, timeSlot }
 * Enforces all the spec rules, then SMSes both the customer and the admin.
 */
async function postHandler(req) {
  await connectDB();
  const b = await req.json();
  const c = b.customer || {};

  if (!["service", "package"].includes(b.itemType)) return fail("Invalid booking type", 400);
  if (!b.itemId || !b.date || !b.timeSlot) return fail("Missing booking details", 400);
  if (!c.firstName?.trim() || !c.phone?.trim()) return fail("Name and phone are required", 400);

  // Date rules: not today/past, not a holiday.
  if (dateKey(b.date) <= todaySLKey()) return fail("You cannot book today or a past date", 400);
  if (await Holiday.findOne({ date: dateKey(b.date) }).lean())
    return fail("The salon is closed on that day", 400);

  // Load the item and validate the chosen slot exists.
  const item =
    b.itemType === "service"
      ? await Service.findOne({ _id: b.itemId, active: true }).lean()
      : await Package.findOne({ _id: b.itemId, active: true }).lean();
  if (!item) return fail("This item is no longer available", 400);
  if (!(item.timeSlots || []).includes(b.timeSlot)) return fail("That time slot is not available", 400);

  // The slot can hold up to the item's maxBookings for this date + time slot.
  const max = item.maxBookings || 1;
  const slotCount = await Booking.countDocuments({
    itemRef: b.itemId,
    date: dateKey(b.date),
    timeSlot: b.timeSlot,
    status: { $in: ["pending", "confirm"] },
  });
  if (slotCount >= max) return fail("Sorry, that time slot is fully booked", 409);

  const bookingId = await nextId("BOOK");
  let booking;
  try {
    booking = await Booking.create({
      bookingId,
      itemType: b.itemType,
      itemRef: b.itemId,
      itemName: item.name,
      price: item.sellingPrice,
      customer: {
        firstName: c.firstName.trim(),
        lastName: (c.lastName || "").trim(),
        phone: c.phone.trim(),
        whatsapp: (c.whatsapp || c.phone).trim(),
        gender: ["male", "female"].includes(c.gender) ? c.gender : "",
      },
      date: dateKey(b.date),
      timeSlot: b.timeSlot,
      status: "pending",
      source: "web",
    });
  } catch (err) {
    // The compound unique index (same customer, item, day, slot) fired.
    if (err.code === 11000) return fail("You have already booked this slot", 409);
    throw err;
  }


  // SMS both parties (fire and forget).
  const settings = await getSettings();
  const fullName = `${c.firstName.trim()} ${(c.lastName || "").trim()}`.trim();
  if (b.itemType === "package") {
    smsService.packageBookingToCustomer(c.phone.trim(), { bookingId }).catch(() => {});
    if (settings.adminSmsPhone)
      smsService.packageBookingToAdmin(settings.adminSmsPhone, {
        packageName: item.name, date: dateKey(b.date), time: b.timeSlot, name: fullName, phone: c.phone.trim(),
      }).catch(() => {});
  } else {
    smsService.serviceBookingToCustomer(c.phone.trim(), { bookingId }).catch(() => {});
    if (settings.adminSmsPhone)
      smsService.serviceBookingToAdmin(settings.adminSmsPhone, {
        serviceName: item.name, date: dateKey(b.date), time: b.timeSlot, name: fullName, phone: c.phone.trim(),
      }).catch(() => {});
  }

  return created({ bookingId }, "Booking placed");
}

export const POST = withErrorHandler(postHandler);
