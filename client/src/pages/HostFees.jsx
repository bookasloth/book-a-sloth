import { Link } from 'react-router-dom';
import LegalLayout, { Section } from '../components/common/LegalLayout';

// /host-fees — Host Fee & Payment Schedule. Annexure A to the Host Services
// Agreement (/host-agreement), kept as a separate page so charges can be amended
// on 30 days' notice under clause 5.6 without re-executing the Agreement.
//
// The worked examples are the source of truth hosts will quote back at us, so they
// must stay numerically identical to docs/payment-model.md and to whatever
// pricingEngine actually computes. If one changes, change all three.

const Mail = () => <a href="mailto:team@timewheel.co.in" className="text-primary hover:underline">team@timewheel.co.in</a>;

const Th = ({ children, className = '' }) => (
  <th className={`text-left p-2.5 font-semibold text-ink border-b-2 border-gray-200 ${className}`}>{children}</th>
);
const Td = ({ children, className = '' }) => (
  <td className={`p-2.5 border-b border-gray-100 ${className}`}>{children}</td>
);

const HostFees = () => (
  <LegalLayout
    title="Host Fee & Payment Schedule"
    updated="24 July 2026"
    effective="on your acceptance during host onboarding"
    current="/host-fees"
    description="What Book A Sloth charges hosts — booking charge, platform commission, payment processing, the payment cycle, and worked examples for GST and non-GST hosts."
    intro={
      <>
        <p>
          This Schedule forms part of, and must be read with, the{' '}
          <Link to="/host-agreement" className="text-primary hover:underline">Host Services Agreement</Link>. Terms
          defined there have the same meaning here. It may be amended on <strong>30 days&rsquo; notice</strong> under
          clause 5.6 of that Agreement.
        </p>
        <p className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
          <strong>The short version.</strong> You tell us what you want to earn. We add our charges and GST, and that
          becomes the price your Guest pays. Your Guest pays the same amount whichever Plan you are on, whether or not
          you are GST-registered, and however they choose to pay.
        </p>
      </>
    }
  >
    <Section title="1. Charges by Plan">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-2 border-gray-200 rounded-xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <Th>Plan</Th>
              <Th>Booking Charge</Th>
              <Th>Platform Commission</Th>
              <Th>Payment Processing</Th>
              <Th>Max price per Service</Th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr>
              <Td><strong>Starter</strong> (free)</Td>
              <Td>₹10</Td>
              <Td><strong>5%</strong> of Target Earning</Td>
              <Td>included &mdash; we bear it</Td>
              <Td><strong>₹5,000</strong></Td>
            </tr>
            <tr>
              <Td><strong>Host+</strong></Td>
              <Td>₹10</Td>
              <Td>nil</Td>
              <Td>2.5% of Guest Price</Td>
              <Td>no limit</Td>
            </tr>
            <tr>
              <Td><strong>Studio</strong></Td>
              <Td>₹10</Td>
              <Td>nil</Td>
              <Td>2.5% of Guest Price</Td>
              <Td>no limit</Td>
            </tr>
            <tr>
              <Td className="border-b-0"><strong>Enterprise</strong></Td>
              <Td className="border-b-0" colSpan={4}>as agreed in your Enterprise order form</Td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="pt-1">
        Subscription prices for Host+, Studio, and Enterprise are shown on the{' '}
        <Link to="/pricing" className="text-primary hover:underline">Pricing page</Link> and are charged separately
        with GST. Studio and Host+ carry the same per-booking charges; Studio differs on Platform features, not on
        price.
      </p>
      <p>
        <strong>Free bookings.</strong> A Service priced at ₹0 attracts no Booking Charge, no Platform Commission, and
        no Payment Processing Charge.
      </p>
    </Section>

    <Section title="2. Payment Processing Charge">
      <p>
        The Payment Processing Charge is a <strong>flat 2.5% of the Guest Price</strong> and applies at the same rate to{' '}
        <strong>every payment method</strong> &mdash; UPI, RuPay, debit card, credit card, net banking, wallet, and
        international cards alike.
      </p>
      <p>
        It is a flat blended charge, not a pass-through of what any particular transaction costs us. Our actual cost
        varies by method: some methods cost us more than 2.5% and some cost us nothing at all. Where the actual cost is
        higher, Book A Sloth bears the difference. Where it is lower, Book A Sloth retains the difference. We state this
        plainly so there is nothing for you to discover later.
      </p>
      <p>
        On the Starter Plan this charge is included in the 5% Platform Commission and is not deducted separately.
      </p>
    </Section>

    <Section title="3. How your consideration is computed">
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 font-mono text-xs leading-relaxed">
        E&nbsp;&nbsp;=&nbsp;your Target Earning (you set this)<br />
        V&nbsp;&nbsp;=&nbsp;E + Booking Charge&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;taxable value<br />
        G&nbsp;&nbsp;=&nbsp;V + GST&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;what your Guest pays<br />
        H&nbsp;&nbsp;=&nbsp;E &minus; Commission &minus; Processing&nbsp;&nbsp;what we pay you
      </div>
      <p>
        Because <strong>V is always E + ₹10</strong>, the Guest Price depends only on what you choose to earn. Your
        Plan, your GST status, and your Guest&rsquo;s payment method never change it.
      </p>
      <p>
        GST is charged at the rate applicable to the service category. The examples below use <strong>18%</strong>,
        which applies to most categories. Amounts are rounded to the nearest paisa.
      </p>
    </Section>

    <Section title="4. Worked examples — Target Earning ₹1,000">
      <p className="font-semibold text-ink">4.1 Host+ or Studio</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-2 border-gray-200 rounded-xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <Th>&nbsp;</Th>
              <Th>GST-registered Host</Th>
              <Th>Host not registered</Th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr><Td>Your Guest pays</Td><Td>₹1,191.80</Td><Td>₹1,191.80</Td></tr>
            <tr><Td>Payment Processing 2.5%</Td><Td>₹29.80</Td><Td>₹29.80</Td></tr>
            <tr><Td>Platform Commission</Td><Td>nil</Td><Td>nil</Td></tr>
            <tr><Td><strong>Your consideration (H)</strong></Td><Td><strong>₹970.20</strong></Td><Td><strong>₹970.20</strong></Td></tr>
            <tr><Td>Your document to us</Td><Td>tax invoice ₹1,144.84</Td><Td>Payment Advice ₹970.20</Td></tr>
            <tr><Td>TDS at 10%</Td><Td>₹97.02</Td><Td>₹97.02</Td></tr>
            <tr><Td><strong>Credited to your bank</strong></Td><Td><strong>₹1,047.82</strong></Td><Td><strong>₹873.18</strong></Td></tr>
            <tr><Td className="border-b-0">You account for GST of</Td><Td className="border-b-0">₹174.64</Td><Td className="border-b-0">nil</Td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs pt-1">
        Both Hosts end up with the same ₹970.20. The registered Host receives more into the bank because part of it is
        GST he then accounts for himself. TDS is not a charge by us &mdash; it is deposited to your PAN and claimable
        in your return.
      </p>

      <p className="font-semibold text-ink pt-3">4.2 Starter</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-2 border-gray-200 rounded-xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <Th>&nbsp;</Th>
              <Th>GST-registered Host</Th>
              <Th>Host not registered</Th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr><Td>Your Guest pays</Td><Td>₹1,191.80</Td><Td>₹1,191.80</Td></tr>
            <tr><Td>Platform Commission 5%</Td><Td>₹50.00</Td><Td>₹50.00</Td></tr>
            <tr><Td>Payment Processing</Td><Td>included</Td><Td>included</Td></tr>
            <tr><Td><strong>Your consideration (H)</strong></Td><Td><strong>₹950.00</strong></Td><Td><strong>₹950.00</strong></Td></tr>
            <tr><Td>Your document to us</Td><Td>tax invoice ₹1,121.00</Td><Td>Payment Advice ₹950.00</Td></tr>
            <tr><Td>TDS at 10%</Td><Td>₹95.00</Td><Td>₹95.00</Td></tr>
            <tr><Td className="border-b-0"><strong>Credited to your bank</strong></Td><Td className="border-b-0"><strong>₹1,026.00</strong></Td><Td className="border-b-0"><strong>₹855.00</strong></Td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs pt-1">
        The Guest Price is identical to the Host+ example. Moving to a paid Plan does not make you more expensive to
        your Guest &mdash; it increases what you keep.
      </p>
    </Section>

    <Section title="5. If you are not registered under GST">
      <p>
        Book A Sloth is the seller of record, so GST is chargeable on the whole sale at our GSTIN regardless of your own
        registration status. That is why the Guest Price is higher than your Target Earning by more than our charges
        alone.
      </p>
      <p>
        This is worth understanding before you list. If you sold the same service privately and were below the GST
        registration threshold, no GST would arise and your customer would pay less. Selling through Book A Sloth brings
        the sale inside the GST net. We show you the exact figures before you publish a price so you can decide with
        the numbers in front of you.
      </p>
      <p>
        If you later register for GST, tell us and we will record it. Your consideration does not change; only the
        documentation and the split between payment and tax do. Changes apply from the date we record them and are
        never applied to earlier Bookings.
      </p>
    </Section>

    <Section title="6. Payment cycle">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-2 border-gray-200 rounded-xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <Th>Services completed</Th>
              <Th>Cut-off</Th>
              <Th>Paid on or before</Th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr><Td>1st &ndash; 15th</Td><Td>15th</Td><Td>last working day of that month</Td></tr>
            <tr><Td className="border-b-0">16th &ndash; end of month</Td><Td className="border-b-0">last day of month</Td><Td className="border-b-0">15th of the following month</Td></tr>
          </tbody>
        </table>
      </div>
      <ul className="list-disc pl-5 space-y-1.5 pt-2">
        <li>A Booking enters a cycle only if the Service was completed <strong>at least 7 days before the cut-off</strong> and the cancellation and dispute window has closed.</li>
        <li><strong>Minimum payment ₹500.</strong> Below that, the balance carries forward to the next cycle.</li>
        <li>For your first <strong>90 days</strong> or first 20 completed Bookings, whichever is later, we may retain a <strong>10% security holdback</strong>, released after that period to the extent not applied against amounts you owe. See clause 7.3 of the Agreement.</li>
        <li>We may defer payment while a complaint, refund, chargeback, or verification is open, or while your KYC, PAN, bank, or GST details are incomplete. See clause 7.4.</li>
        <li>Payment is made to the verified bank account on your Host account. <strong>A valid PAN is required before your first payment.</strong></li>
        <li>Raise any query on a statement within <strong>30 days</strong>. After that it is treated as accepted.</li>
      </ul>
    </Section>

    <Section title="7. What we may deduct">
      <p>Under clause 9 of the Agreement we may deduct from amounts payable to you:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>refunds and credits given to a Guest for a Booking you supplied or failed to supply;</li>
        <li>chargebacks and payment reversals, and the fees charged to us for them;</li>
        <li>a <strong>₹500</strong> handling charge per chargeback or upheld Guest complaint;</li>
        <li>a <strong>₹250</strong> handling charge per cancellation or non-attendance attributable to you, plus the processing cost of the resulting refund;</li>
        <li>input tax credit denied or reversed because of your GST filing, with interest and penalty;</li>
        <li>tax, interest, or penalty demanded from us in respect of payments to you;</li>
        <li>subscription and Plan fees, and any other sum you owe us;</li>
        <li>overpayments and amounts paid in error;</li>
        <li>liquidated damages for off-platform dealing under clause 15.3.</li>
      </ul>
    </Section>

    <Section title="8. Cancellations and refunds">
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>You cancel or do not attend.</strong> The Guest is refunded in full, including our charges. No consideration is payable to you, and clause 12.3 applies.</li>
        <li><strong>Guest cancels in the refundable window.</strong> The Guest is refunded the service portion. The Booking Charge and Payment Processing Charge are not refunded. No consideration is payable to you.</li>
        <li><strong>Guest cancels late or does not attend.</strong> Handled under the <Link to="/refund" className="text-primary hover:underline">Refund &amp; Cancellation Policy</Link>. Where the Booking is treated as non-refundable, your consideration remains payable.</li>
      </ul>
    </Section>

    <Section title="9. Changes to this Schedule">
      <p>
        We may amend this Schedule on <strong>30 days&rsquo; notice</strong> by email or in-Platform notification.
        Amended charges apply only to Bookings confirmed after the notice period ends. The charges applicable to a
        Booking are fixed and recorded when that Booking is confirmed. If you do not accept an amendment you may
        terminate under clause 19.1 of the Agreement before it takes effect.
      </p>
    </Section>

    <Section title="10. Questions">
      <p>
        Email <Mail /> or call +91 8637758344. For anything tax-related that affects your own returns, please take your
        own professional advice &mdash; we can explain what we charge and what we deduct, but we cannot advise you on
        your tax position.
      </p>
      <p className="pt-1"><strong>Timewheel Internet Private Limited</strong> (CIN: U62012OD2026PTC052654 | GSTIN: 21AAMCT8270C1ZF)</p>
    </Section>
  </LegalLayout>
);

export default HostFees;
