import { Link } from 'react-router-dom';
import LegalLayout, { Section, MOR_EFFECTIVE } from '../components/common/LegalLayout';

// /guest-terms — Guest Terms of Sale.
//
// The sale contract between Book A Sloth and the Guest. Under the merchant-of-record
// model WE are the seller and the supplier of record — the Host performs the service
// as our service partner, not as the Guest's counterparty. Every consumer-facing
// statement here must stay consistent with that, because the same characterisation
// is what our GST filings and the Host Services Agreement rest on.
//
// Deliberately does NOT try to disclaim liability for the service itself: under the
// Consumer Protection Act 2019 we are the supplier and cannot contract out of it.
// Claiming otherwise would be an unfair contract term and would also contradict the
// tax position. See docs/payment-model.md.

const Mail = () => <a href="mailto:team@timewheel.co.in" className="text-primary hover:underline">team@timewheel.co.in</a>;

const GuestTerms = () => (
  <LegalLayout
    title="Guest Terms of Sale"
    updated="24 July 2026"
    effective={MOR_EFFECTIVE}
    current="/guest-terms"
    description="The terms on which Book A Sloth sells services to guests — who you are buying from, what is included, cancellations, rescheduling, and your rights if something goes wrong."
    intro={
      <>
        <p>
          These Guest Terms of Sale (&ldquo;<strong>Terms of Sale</strong>&rdquo;) apply every time you book or buy a
          service on Book A Sloth. Book A Sloth is operated by <strong>Timewheel Internet Private Limited</strong>{' '}
          (CIN: U62012OD2026PTC052654, GSTIN: 21AAMCT8270C1ZF) (&ldquo;<strong>Book A Sloth</strong>&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;).
        </p>
        <p className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
          <strong>Who you are buying from.</strong> You are buying the service <strong>from Book A Sloth</strong>. We
          are the seller. The host shown on the listing performs the service as our service partner. Your contract, your
          invoice, your payment, and any complaint or refund are all with us &mdash; not with the host. If something
          goes wrong, you deal with one company: us.
        </p>
        <p>
          Read these together with our{' '}
          <Link to="/terms" className="text-primary hover:underline">Terms of Use</Link>, our{' '}
          <Link to="/refund" className="text-primary hover:underline">Refund &amp; Cancellation Policy</Link>, and our{' '}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. If there is any conflict
          about a purchase, these Terms of Sale prevail.
        </p>
      </>
    }
  >
    <Section title="1. Who is selling to you">
      <p>
        <strong>1.1</strong> Book A Sloth buys the service from the host and sells it to you in its own name and on its
        own account. We are the <strong>seller and supplier of record</strong>.
      </p>
      <p>
        <strong>1.2</strong> The host performs the service under an agreement with us. You do not enter into a separate
        contract with the host, and the host is not your counterparty for the booking.
      </p>
      <p>
        <strong>1.3</strong> This means you have one place to go for everything &mdash; the invoice, the payment, a
        reschedule, a refund, or a complaint. You do not have to chase the host.
      </p>
      <p>
        <strong>1.4</strong> Where a listing names a host, that name identifies who will perform the service. It does
        not change who is selling it to you.
      </p>
    </Section>

    <Section title="2. Price, tax, and your invoice">
      <p>
        <strong>2.1</strong> The price shown at checkout is the total amount payable. It is{' '}
        <strong>inclusive of GST</strong> and of all charges. There are no charges added after checkout.
      </p>
      <p>
        <strong>2.2</strong> Before you pay, the checkout itemises what makes up the price, including the applicable
        tax. Please review it before confirming.
      </p>
      <p>
        <strong>2.3</strong> We issue you a <strong>tax invoice from Book A Sloth</strong> under our GSTIN for the full
        amount. Keep it &mdash; it is your record of purchase.
      </p>
      <p>
        <strong>2.4</strong> All prices are in Indian Rupees. If you pay using a card issued outside India, your bank
        may apply its own conversion rate and charges, which are not ours and are not refundable by us.
      </p>
      <p>
        <strong>2.5</strong> We ask for your state at checkout because tax law requires it to determine the correct GST
        treatment.
      </p>
    </Section>

    <Section title="3. When your booking becomes a contract">
      <p>
        <strong>3.1</strong> Displaying a service is an invitation to book, not an offer. Your booking is an offer to
        buy.
      </p>
      <p>
        <strong>3.2</strong> A contract is formed when we confirm the booking &mdash; normally immediately after
        successful payment, by on-screen confirmation and email. Free bookings are confirmed on submission.
      </p>
      <p>
        <strong>3.3</strong> We may decline or cancel a booking before the service is delivered if the service is
        unavailable, if the listing contained a manifest pricing or description error, if we cannot verify your details,
        or if we reasonably suspect fraud or misuse. If we do, we refund you in full. That is the limit of our liability
        for declining a booking.
      </p>
      <p>
        <strong>3.4</strong> You must be at least 18 and able to contract under Indian law. Some services may carry
        their own age, health, or eligibility requirements shown on the listing; you are responsible for meeting them.
      </p>
    </Section>

    <Section title="4. What you are buying">
      <p>
        <strong>4.1</strong> You are buying the service described on the listing, for the stated duration, at the
        stated date and time, delivered in the stated mode (online or in person).
      </p>
      <p>
        <strong>4.2 Online services.</strong> You are responsible for your own device, software, and internet
        connection. Where a meeting link is issued, it is sent to the contact details you provided.
      </p>
      <p>
        <strong>4.3 In-person services.</strong> You are responsible for travelling to the stated location and for your
        own travel costs. Any access, safety, or house rules notified for the location apply.
      </p>
      <p>
        <strong>4.4 Outcomes are not guaranteed.</strong> Services are supplied with reasonable skill and care. Unless a
        listing says so explicitly and in terms, no particular result, outcome, or benefit is promised.
      </p>
      <p>
        <strong>4.5 Not professional advice unless stated.</strong> Nothing bought through Book A Sloth is medical,
        psychological, legal, financial, or investment advice unless the listing expressly says so and the person
        performing it holds the necessary qualifications. In an emergency, contact the appropriate emergency or
        professional service.
      </p>
    </Section>

    <Section title="5. Changing or cancelling your booking">
      <p>
        <strong>5.1</strong> Cancellation and refund entitlements are set out in the{' '}
        <Link to="/refund" className="text-primary hover:underline">Refund &amp; Cancellation Policy</Link>, which forms
        part of these Terms of Sale. Please read it before you book &mdash; the cancellation window is shown at
        checkout.
      </p>
      <p>
        <strong>5.2 Booking and processing charges are not refundable.</strong> Where you cancel, the small booking
        charge and payment processing charge shown at checkout are retained, because they are costs we have already
        incurred on your booking. This is displayed to you before you pay. Where <strong>we or the host</strong> cancel
        or fail to deliver, you are refunded in full, including those charges.
      </p>
      <p>
        <strong>5.3 Rescheduling.</strong> Where the listing allows it, you may reschedule free of charge up to the
        stated cut-off, subject to availability. A reschedule requested after the cut-off is treated as a cancellation.
      </p>
      <p>
        <strong>5.4 If you do not attend.</strong> If you do not attend at the scheduled time, or arrive so late that
        the service cannot reasonably be delivered, the booking is treated as delivered and is not refundable. The
        service may still end at the scheduled finish time.
      </p>
      <p>
        <strong>5.5 If we substitute the person performing the service.</strong> Where the person originally shown is
        unavailable, we may arrange an equivalently qualified person to perform it. We will tell you in advance. If the
        substitution is not acceptable to you, tell us before the scheduled time and we will refund you in full.
      </p>
      <p>
        <strong>5.6 If we cancel.</strong> If we cancel or cannot deliver, we will offer you a reschedule or a full
        refund, at your choice. Our liability for a cancelled or undelivered booking is dealt with in clause 8.
      </p>
    </Section>

    <Section title="6. Your responsibilities">
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Give accurate contact and booking details. We are not responsible for a booking you miss because the details you gave us were wrong.</li>
        <li>Attend punctually, or cancel in time.</li>
        <li>Treat the person performing the service with respect. Abusive, threatening, discriminatory, or unsafe behaviour ends the service immediately, with no refund, and may end your access to the Platform.</li>
        <li>Disclose anything genuinely relevant to safe delivery, where the listing asks for it.</li>
        <li>Do not record, stream, or republish a session without the express consent of everyone involved.</li>
        <li>Do not arrange to pay outside the Platform for a booking started on it. If you do, these Terms of Sale, our Refund Policy, and our support do not apply to that transaction, and we cannot help you if it goes wrong.</li>
      </ul>
    </Section>

    <Section title="7. If something goes wrong">
      <p>
        <strong>7.1</strong> If the service was not delivered, was materially different from its description, or fell
        below reasonable standards, tell us at <Mail /> within <strong>7 days</strong> of the scheduled time. Include
        your booking reference and what happened.
      </p>
      <p>
        <strong>7.2</strong> We will investigate, contact the host where relevant, and respond. Depending on what we
        find, we may offer a reschedule, a partial refund, or a full refund.
      </p>
      <p>
        <strong>7.3</strong> Because we are the seller, you do not need to pursue the host. We deal with the host
        ourselves.
      </p>
      <p>
        <strong>7.4</strong> Please come to us before raising a chargeback with your bank. A chargeback raised without
        contacting us usually takes longer to resolve than a direct request. We may contest chargebacks we consider
        unwarranted and provide the relevant transaction records to the payment provider.
      </p>
    </Section>

    <Section title="8. Our responsibility to you">
      <p>
        <strong>8.1</strong> We supply services with reasonable skill and care, and we are responsible to you as the
        seller of those services.
      </p>
      <p>
        <strong>8.2</strong> Where we are liable for a booking that was not delivered or was deficient, our liability
        is to refund the amount you paid for that booking and to compensate you for reasonably foreseeable direct loss
        caused by our breach.
      </p>
      <p>
        <strong>8.3</strong> We are not liable for indirect or consequential loss, or for loss of profit, income,
        opportunity, or data, or for loss caused by something outside our reasonable control.
      </p>
      <p>
        <strong>8.4</strong> Nothing in these Terms of Sale excludes or limits any right you have under the{' '}
        <strong>Consumer Protection Act, 2019</strong> or any other law that cannot be excluded. Where anything here
        conflicts with such a right, that right prevails.
      </p>
    </Section>

    <Section title="9. Complaints, grievances, and disputes">
      <p>
        <strong>9.1</strong> Contact us first at <Mail /> or +91 8637758344. We aim to acknowledge within 48 hours and
        resolve within 15 working days.
      </p>
      <p>
        <strong>9.2 Grievance Officer.</strong> If you are not satisfied, escalate to our Grievance Officer,{' '}
        <strong>Shubham Narendra Datarkar</strong>, at <Mail />. Grievances are addressed within the timeframes
        required by applicable law.
      </p>
      <p>
        <strong>9.3</strong> These Terms of Sale are governed by the laws of India.
      </p>
      <p>
        <strong>9.4</strong> Nothing here restricts your right as a consumer to bring proceedings in the consumer forum
        having jurisdiction where you reside or work, as provided by the Consumer Protection Act, 2019.
      </p>
    </Section>

    <Section title="10. Changes">
      <p>
        We may update these Terms of Sale. <strong>The version in force at the time of your booking governs that
        booking</strong>, so a later change never affects a purchase you have already made. We publish revised versions
        with a new &ldquo;Last updated&rdquo; date.
      </p>
    </Section>

    <Section title="11. Seller details">
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Seller:</strong> Timewheel Internet Private Limited, trading as Book A Sloth</li>
        <li><strong>CIN:</strong> U62012OD2026PTC052654 &middot; <strong>GSTIN:</strong> 21AAMCT8270C1ZF</li>
        <li><strong>Email:</strong> <Mail /> &middot; <strong>Phone:</strong> +91 8637758344</li>
        <li><strong>Grievance Officer:</strong> Shubham Narendra Datarkar</li>
        <li><strong>Registered office:</strong> Ground Floor, Holding No-55, Ward No-19, Natapada, Jajpur Road, Byasanagar, District Jajpur, Odisha &ndash; 755019, India</li>
        <li><strong>Operations office:</strong> #6, 2nd Floor, Eureka Coworking, Mate Square, Nagpur, Maharashtra</li>
      </ul>
    </Section>
  </LegalLayout>
);

export default GuestTerms;
