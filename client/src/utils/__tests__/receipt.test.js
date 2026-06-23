import { describe, it, expect } from "vitest";
import { buildReceiptHTML } from "../receipt";

const paid = {
  receiptId: "#ABC12345",
  whenText: "Mon, 23 Jun 2026, 3:00 PM IST",
  serviceTitle: "Strategy Call",
  hostName: "Asha",
  guestName: "Riya",
  guestEmail: "riya@example.com",
  status: "confirmed",
  paymentStatus: "paid",
  paymentId: "pay_123",
  price: 1000,
  platformFee: 10,
  platformFeeGst: 1.8,
  total: 1011.8,
};

describe("buildReceiptHTML", () => {
  it("renders a payment receipt with the full fee + GST breakdown for paid bookings", () => {
    const html = buildReceiptHTML(paid);
    expect(html).toContain("Payment Receipt");
    expect(html).toContain("Strategy Call");
    expect(html).toContain("Asha");
    expect(html).toContain("#ABC12345");
    expect(html).toContain("Platform fee");
    expect(html).toContain("GST");
    expect(html).toContain("₹1,011.8"); // customer_total, en-IN formatted
    expect(html).toContain("₹1,000"); // service price line
    expect(html).toContain("pay_123");
  });

  it("includes the guest name and email when provided", () => {
    const html = buildReceiptHTML(paid);
    expect(html).toContain("Riya");
    expect(html).toContain("riya@example.com");
  });

  it("shows a single Unpaid amount with no GST breakdown for unpaid bookings", () => {
    const html = buildReceiptHTML({ ...paid, paymentStatus: "unpaid", paymentId: undefined });
    expect(html).toContain("Unpaid");
    expect(html).not.toContain("Payment Receipt");
    expect(html).not.toContain("Platform fee");
    expect(html).not.toContain("GST");
  });

  it("shows Free for zero-price bookings", () => {
    const html = buildReceiptHTML({ ...paid, price: 0, total: 0, platformFee: 0, platformFeeGst: 0 });
    expect(html).toContain("Free");
    expect(html).not.toContain("Platform fee");
  });

  it("escapes HTML in user-supplied fields to avoid broken markup", () => {
    const html = buildReceiptHTML({ ...paid, serviceTitle: "A <b>bold</b> & risky title" });
    expect(html).not.toContain("<b>bold</b>");
    expect(html).toContain("&lt;b&gt;bold&lt;/b&gt;");
    expect(html).toContain("&amp;");
  });
});
