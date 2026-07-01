import { Link } from 'react-router-dom';
import LegalLayout, { Section } from '../components/common/LegalLayout';

// /refund — Refund & Cancellation Policy. Text mirrors /legal/REFUND_POLICY.md.
const Mail = () => <a href="mailto:team@timewheel.co.in" className="text-primary hover:underline">team@timewheel.co.in</a>;

const Refund = () => (
  <LegalLayout
    title="Refund & Cancellation Policy"
    current="/refund"
    description="Book A Sloth refund and cancellation policy — how refunds work for bookings, digital products, and subscriptions, processed via Razorpay."
    intro={
      <>
        <p>
          This Refund &amp; Cancellation Policy applies to all payments made on the Book A Sloth platform (the "Platform"),
          operated by <strong>Timewheel Internet Private Limited</strong> (CIN: U62012OD2026PTC052654,
          GSTIN: 21AAMCT8270C1ZF) ("Book A Sloth", "we", "us"). It forms part of, and should be read together with, our{' '}
          <Link to="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link> and{' '}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
        <p>
          All payments are processed through our payment gateway <strong>Razorpay</strong>. All amounts are in Indian
          Rupees (INR) unless stated otherwise.
        </p>
      </>
    }
  >
    <Section title="1. General position — all sales are final">
      <p>
        Bookings, digital product purchases, and plan/subscription fees on the Platform are <strong>final and
        non-refundable</strong>, except in the limited circumstances described in Section 2.
      </p>
      <p>
        By completing a payment you acknowledge that you are paying for a service or product made available to you at
        the time of purchase, and that you are not entitled to a refund merely because you change your mind, fail to
        attend, or no longer want the service.
      </p>
    </Section>

    <Section title="2. When you are eligible for a refund">
      <p>We will issue a refund in the following circumstances:</p>
      <p><strong>(a) Duplicate or erroneous charges.</strong> You were charged more than once for the same booking or product, or a technical error caused an incorrect amount to be charged.</p>
      <p><strong>(b) Payment succeeded but the booking/product was not delivered.</strong> Your payment was completed but, due to a technical failure on the Platform, your booking was not confirmed or your digital product could not be made available to you.</p>
      <p><strong>(c) Host no-show or host cancellation.</strong> The host fails to attend the scheduled appointment, cancels the booking, or does not deliver the service that was paid for, and you did not receive a comparable alternative (such as an agreed reschedule).</p>
      <p><strong>(d) Failed transactions.</strong> Money was debited from your account but the transaction failed or was not recognised by the Platform. In most cases the bank or payment provider reverses such amounts automatically within their standard timelines.</p>
      <p>Refunds are limited to the amount actually paid for the affected booking or product. We do not provide compensation beyond the amount paid.</p>
    </Section>

    <Section title="3. What is not refundable">
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Change of mind, no-shows, or late arrival by the guest.</strong></li>
        <li><strong>Bookings the guest cancels</strong> outside the circumstances in Section 2.</li>
        <li><strong>Services already delivered</strong> or partially delivered as described.</li>
        <li><strong>Plan / subscription fees</strong> paid by hosts (e.g. Host+ or Studio plans), including any applicable GST, once the plan has been activated. These give immediate access to plan features and are non-refundable.</li>
        <li><strong>Digital products</strong> that have been delivered or for which a download link has been issued.</li>
        <li><strong>Payment gateway charges</strong>, where these are non-recoverable from the processor.</li>
      </ul>
    </Section>

    <Section title="4. How to request a refund">
      <p>To request a refund under Section 2:</p>
      <ol className="list-decimal pl-5 space-y-1.5">
        <li>Email <Mail /> within <strong>7 days</strong> of the booking date, appointment time, or purchase.</li>
        <li>Include your name, the email used for the booking, the booking or transaction reference (Razorpay payment ID if available), the date and time of the appointment, and a description of the issue.</li>
      </ol>
      <p>We will review your request and respond within a reasonable time. We may contact the host to verify the circumstances (for example, in a host no-show claim).</p>
    </Section>

    <Section title="5. How refunds are processed">
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Approved refunds are processed back to your <strong>original payment method</strong> through Razorpay.</li>
        <li>We will initiate eligible refunds within <strong>5–7 business days</strong> of approving your request.</li>
        <li>After we initiate a refund, it typically takes <strong>5–10 business days</strong> for the amount to appear in your account, depending on your bank or payment provider's timelines, which are outside our control.</li>
        <li>Refunds are made in INR. Any currency conversion differences or third-party charges are not our responsibility.</li>
      </ul>
    </Section>

    <Section title="6. Role of hosts and the Platform">
      <p>
        Book A Sloth provides the technology that lets hosts publish services and receive payments, and facilitates
        refunds through Razorpay. Hosts are responsible for delivering the services they offer. Where a refund relates
        to a service that was paid out to a host, we may recover or adjust the relevant amount from the host as part of
        processing your refund.
      </p>
    </Section>

    <Section title="7. Chargebacks and disputes">
      <p>
        If you have a concern about a payment, please contact us first at <Mail /> so we can try to resolve it. Raising
        a chargeback with your bank without contacting us may delay resolution. We reserve the right to contest
        chargebacks we believe are unwarranted and to provide relevant transaction records to the payment provider.
      </p>
    </Section>

    <Section title="8. Changes to this Policy">
      <p>
        We may update this Policy from time to time. The version in effect at the time of your purchase governs that
        purchase. We will post the revised version with a new "Last updated" date.
      </p>
    </Section>

    <Section title="9. Contact">
      <p>For any refund or cancellation query:</p>
      <p><strong>Email:</strong> <Mail /> &middot; <strong>Phone:</strong> +91 8637758344</p>
      <p className="pt-1"><strong>Timewheel Internet Private Limited</strong> (CIN: U62012OD2026PTC052654)</p>
      <p>Registered office: Ground Floor, Holding No-55, Ward No-19, Natapada, Jajpur Road, Byasanagar, District Jajpur, Odisha – 755019, India</p>
      <p>Operations office: #6, 2nd Floor, Eureka Coworking, Mate Square, Nagpur, Maharashtra</p>
    </Section>
  </LegalLayout>
);

export default Refund;
