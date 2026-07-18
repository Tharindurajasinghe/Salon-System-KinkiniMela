/**
 * SmsService
 * ----------
 * OOP wrapper around the Sri Lankan SMS gateway (e.g. text.lk / notify.lk).
 * All SMS credentials come from environment variables (never the database).
 *
 * Centralising SMS here means the exact message templates from the spec live
 * in ONE place and are reused by every route (orders, bookings, status changes).
 */
export class SmsService {
  constructor() {
    this.apiKey = process.env.SMS_API_KEY;
    this.senderId = process.env.SMS_SENDER_ID;
    this.apiUrl = process.env.SMS_API_URL;
  }

  /** Low-level send. Returns { success, message }. */
  async send(to, message) {
    // Basic guard so local dev without SMS keys does not crash the flow.
    if (!this.apiKey || !this.apiUrl) {
      console.warn("[SMS] Not configured. Would have sent to", to, ":", message);
      return { success: false, message: "SMS not configured" };
    }

    const localNumber = this.#normalize(to);

    try {
      const res = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: localNumber,
          sender_id: this.senderId,
          type: "plain",
          message,
          api_token: this.apiKey,
        }),
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok, message: data?.message || "sent", data };
    } catch (err) {
      console.error("[SMS] send failed", err);
      return { success: false, message: err.message };
    }
  }

  // ---- Reusable message templates (exact wording from the spec) ----

  async newProductOrderToAdmin(adminPhone, { orderId, items, pickupDate, firstName }) {
    const list = items.map((i) => `${i.name} x${i.qty}`).join(", ");
    return this.send(
      adminPhone,
      `New product order (${orderId}). Items: ${list}. Pickup: ${pickupDate}. Customer: ${firstName}.`
    );
  }

  async packageBookingToCustomer(phone, { bookingId }) {
    return this.send(
      phone,
      `Your package booking is pending. Booking ID: ${bookingId}.`
    );
  }

  async packageBookingToAdmin(adminPhone, { packageName, date, time, name, phone }) {
    return this.send(
      adminPhone,
      `New package booking: ${packageName} on ${date} at ${time}. Customer: ${name} (${phone}).`
    );
  }

  async serviceBookingToCustomer(phone, { bookingId }) {
    return this.send(
      phone,
      `Your booking is pending. After admin approval you will receive a message. Booking ID: ${bookingId}.`
    );
  }

  async serviceBookingToAdmin(adminPhone, { serviceName, date, time, name, phone }) {
    return this.send(
      adminPhone,
      `New service booking: ${serviceName} on ${date} at ${time}. Customer: ${name} (${phone}).`
    );
  }

  async statusConfirmed(phone, { type, id }) {
    return this.send(phone, `Your ${type} ${id} is confirmed.`);
  }

  async statusRejected(phone, { type, id, reason }) {
    return this.send(phone, `Your ${type} ${id} is rejected - ${reason}.`);
  }

  /** Convert local/international formats to the gateway's expected number. */
  #normalize(phone) {
    let p = String(phone).replace(/\s+/g, "");
    if (p.startsWith("+94")) p = "0" + p.slice(3);
    if (p.startsWith("94")) p = "0" + p.slice(2);
    return p;
  }
}

// Export a ready-to-use singleton.
export const smsService = new SmsService();
