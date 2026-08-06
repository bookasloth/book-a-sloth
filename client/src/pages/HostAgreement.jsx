import { Link } from 'react-router-dom';
import LegalLayout, { Section } from '../components/common/LegalLayout';

// /host-agreement — Host Services Agreement.
//
// ⚠️ SUPERSEDED BY MARKETPLACE MODEL v4 — NOT YET REWRITTEN. This document still
// describes the ABANDONED merchant-of-record model (Host supplies TO Book A Sloth;
// nothing "settled"). Under v4 the Host SELLS TO THE GUEST and authorises Book A Sloth
// to COLLECT the guest payment and REMIT the Host's price net of commission, gateway,
// TDS (194-O) and TCS (§52). Clauses 2 (nature of relationship) and 16 (no collection
// on either's behalf) are the RBI Payment-Aggregator-sensitive core: their marketplace
// wording MUST be authored by the lawyer + CA to match the PA-waiver exactly — do NOT
// hand-edit them. Clause 8 becomes 194-O 1% + §52 TCS 1%, PAN mandatory before paid
// bookings. Full spec: docs/legal-marketplace-revert-brief.md. Do not deploy as-is.

const Mail = () => <a href="mailto:team@timewheel.co.in" className="text-primary hover:underline">team@timewheel.co.in</a>;

const HostAgreement = () => (
  <LegalLayout
    title="Host Services Agreement"
    updated="24 July 2026"
    effective="on your acceptance during host onboarding"
    current="/host-agreement"
    description="The agreement between Book A Sloth and its Hosts — how services are purchased, priced, invoiced, and paid for. Read before you list a service."
    intro={
      <>
        <p>
          This Host Services Agreement (the &ldquo;<strong>Agreement</strong>&rdquo;) is entered into between{' '}
          <strong>Timewheel Internet Private Limited</strong> (CIN: U62012OD2026PTC052654,
          GSTIN: 21AAMCT8270C1ZF), a company incorporated in India under the Companies Act, 2013, operating the
          Book A Sloth platform (&ldquo;<strong>Book A Sloth</strong>&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;our&rdquo;), and you, the person or entity offering services through the Platform (the
          &ldquo;<strong>Host</strong>&rdquo;, &ldquo;you&rdquo;, &ldquo;your&rdquo;).
        </p>
        <p className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900">
          <strong>Draft under revision.</strong> This Agreement is being updated to Book A Sloth&rsquo;s marketplace
          model: you are the seller of your service to the Guest, and Book A Sloth is the marketplace that lists it,
          collects payment, and pays you your price net of its commission, the payment-gateway charge, and tax deducted
          at source (TDS and TCS). The <Link to="/host-fees" className="text-primary hover:underline">Host Fee &amp;
          Payment Schedule</Link> reflects the current figures; the clauses below are being revised to match.
        </p>
        <p>
          This Agreement incorporates the <Link to="/host-fees" className="text-primary hover:underline">Host Fee &amp;
          Payment Schedule</Link> (the &ldquo;<strong>Fee Schedule</strong>&rdquo;), our{' '}
          <Link to="/terms" className="text-primary hover:underline">Terms of Use</Link>, and our{' '}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. By clicking to accept,
          creating a Host account, or listing a service, you agree to be bound by all of them.
        </p>
      </>
    }
  >
    <Section title="1. Definitions">
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>&ldquo;Platform&rdquo;</strong> — the Book A Sloth website, applications, and related systems.</li>
        <li><strong>&ldquo;Guest&rdquo;</strong> — an end customer who purchases a Service from Book A Sloth through the Platform.</li>
        <li><strong>&ldquo;Service&rdquo;</strong> — an appointment, consultation, session, class, or other service you supply under this Agreement.</li>
        <li><strong>&ldquo;Booking&rdquo;</strong> — a confirmed order for a Service.</li>
        <li><strong>&ldquo;Target Earning&rdquo;</strong> or <strong>&ldquo;E&rdquo;</strong> — the amount you specify on the Platform as what you wish to earn for a Service, before the deductions in clause 5.</li>
        <li><strong>&ldquo;Host Consideration&rdquo;</strong> or <strong>&ldquo;H&rdquo;</strong> — the amount actually payable to you for a Booking, computed under clause 5.</li>
        <li><strong>&ldquo;Guest Price&rdquo;</strong> — the total amount payable by the Guest to Book A Sloth for a Booking, inclusive of GST.</li>
        <li><strong>&ldquo;Payment Cycle&rdquo;</strong> — the periodic payment of your invoices described in clause 7 and the Fee Schedule.</li>
        <li><strong>&ldquo;Plan&rdquo;</strong> — the subscription tier applicable to your Host account (Starter, Host+, Studio, or Enterprise).</li>
      </ul>
    </Section>

    <Section title="2. Nature of the relationship">
      <p>
        <strong>2.1 You supply to us.</strong> You supply the Services to Book A Sloth. Book A Sloth supplies those
        Services onward to Guests <strong>in its own name and on its own account</strong> as the seller and supplier of
        record.
      </p>
      <p>
        <strong>2.2 No contract with the Guest.</strong> You have no contractual relationship with the Guest in respect
        of a Booking. The Guest&rsquo;s contract is with Book A Sloth. You may not represent to a Guest that they are
        contracting with you.
      </p>
      <p>
        <strong>2.3 Independent contractor.</strong> You are an independent contractor. Nothing in this Agreement
        creates an agency, partnership, joint venture, franchise, or employment relationship between you and Book A
        Sloth. You are not entitled to any employment benefit, and you are responsible for your own establishment,
        staff, equipment, insurance, and statutory obligations.
      </p>
      <p>
        <strong>2.4 Neither party collects for the other.</strong> Neither party collects money as agent for the other.
        Amounts received by Book A Sloth from Guests are Book A Sloth&rsquo;s own revenue. Amounts paid by Book A Sloth
        to you are payments against your invoice as a supplier. See also clause 16.
      </p>
      <p>
        <strong>2.5 Non-exclusive.</strong> This Agreement is non-exclusive. You may supply the same or similar
        services elsewhere, subject to clause 15.
      </p>
    </Section>

    <Section title="3. Your appointment and how orders are placed">
      <p>
        <strong>3.1</strong> Each confirmed Booking constitutes a purchase order from Book A Sloth to you for the
        specified Service, at the specified date and time, at the Host Consideration computed under clause 5.
      </p>
      <p>
        <strong>3.2</strong> You accept a purchase order by publishing the availability against which it was booked. A
        Booking becomes binding on you when the Platform confirms it.
      </p>
      <p>
        <strong>3.3</strong> Book A Sloth is not obliged to place any minimum volume of orders, to promote your
        listings, or to achieve any level of visibility, bookings, or income for you. Any projection, estimate, or
        calculator output shown on the Platform is an illustration only and is not a representation, warranty, or
        guarantee.
      </p>
      <p>
        <strong>3.4 Substitution.</strong> Where you are unable to perform a confirmed Booking, Book A Sloth may (but
        is not obliged to) arrange for an equivalently qualified Host to perform it. Where it does so, no Host
        Consideration is payable to you for that Booking and clause 12.3 applies.
      </p>
    </Section>

    <Section title="4. Your warranties and obligations">
      <p>You represent, warrant, and undertake on a continuing basis that:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>You are at least 18 years old and legally competent to contract under Indian law.</li>
        <li>You hold, and will maintain, <strong>every licence, registration, certification, and qualification</strong> required by law or by professional regulation to supply your Services, and will produce evidence within 7 days of request.</li>
        <li>Your listings, descriptions, credentials, images, and pricing are accurate and not misleading, and you will keep them current.</li>
        <li>You will supply the Services with reasonable skill and care, lawfully, professionally, safely, and in accordance with the description published on the Platform.</li>
        <li>You will attend confirmed Bookings punctually and will not cancel other than in accordance with clause 12.</li>
        <li>You will not supply any service that is unlawful, unsafe, deceptive, obscene, discriminatory, or that infringes the rights of any person.</li>
        <li>You will not offer any service requiring a licence you do not hold, including any medical, psychological, legal, financial-advisory, or other regulated service outside the scope of your qualifications.</li>
        <li>You will comply with all applicable law, including the Consumer Protection Act, 2019, the Consumer Protection (E-Commerce) Rules, 2020, the Digital Personal Data Protection Act, 2023, and applicable tax law.</li>
        <li>You will keep the KYC, bank, PAN, and (where applicable) GST information you provide accurate, and will notify us of any change within <strong>7 days</strong>.</li>
        <li>You will not do anything that brings, or is reasonably likely to bring, Book A Sloth into disrepute.</li>
      </ul>
      <p>
        Each warranty in this clause 4 is a material term of this Agreement. Breach entitles Book A Sloth to exercise
        any remedy in clauses 9, 12, or 19.
      </p>
    </Section>

    <Section title="5. Price and how your consideration is computed">
      <p>
        <strong>5.1 You set your Target Earning.</strong> You specify, for each Service, the amount you wish to earn
        (&ldquo;E&rdquo;). The Platform displays, before you confirm, the resulting Guest Price and the Host
        Consideration payable to you. You are deemed to have seen and accepted that computation for every Service you
        publish.
      </p>
      <p>
        <strong>5.2 All prices are tax-inclusive.</strong> The parties agree that all amounts stated on the Platform
        are <strong>inclusive of GST and of all other applicable taxes, cesses, and levies</strong>. No amount is
        payable by Book A Sloth over and above the amounts computed under this clause.
      </p>
      <p>
        <strong>5.3 The computation.</strong> For each Booking:
      </p>
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 font-mono text-xs leading-relaxed">
        Taxable value&nbsp;&nbsp;&nbsp;&nbsp;V = E + Booking Charge<br />
        Guest Price&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;G = V + GST at the applicable rate<br />
        Your consideration&nbsp;H = E &minus; Platform Commission &minus; Payment Processing Charge
      </div>
      <p>
        The Booking Charge, Platform Commission, and Payment Processing Charge applicable to your Plan are set out in
        the <Link to="/host-fees" className="text-primary hover:underline">Fee Schedule</Link>, which forms part of this
        Agreement and contains worked examples.
      </p>
      <p>
        <strong>5.4 Effect of your GST status.</strong> Your Host Consideration (H) is the same whether or not you are
        registered under GST. What differs is only the mechanics of payment and documentation:
      </p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>If you are <strong>GST-registered</strong>, we pay you H plus GST at the applicable rate against your tax invoice, and you account for that GST to the authorities.</li>
        <li>If you are <strong>not GST-registered</strong>, we pay you H, and no GST component arises on your supply.</li>
      </ul>
      <p>
        <strong>5.5 You acknowledge</strong> that because Book A Sloth is the supplier of record, GST is chargeable on
        the full Guest Price regardless of your own registration status, and that this is reflected in the computation
        in clause 5.3. You confirm you have had the opportunity to take your own tax advice on this.
      </p>
      <p>
        <strong>5.6 Changes to the Fee Schedule.</strong> Book A Sloth may amend the Fee Schedule on{' '}
        <strong>30 days&rsquo; notice</strong> by email or in-Platform notification. Amended charges apply to Bookings
        confirmed after the notice period expires. Charges applicable to a Booking are fixed at the moment that Booking
        is confirmed and are recorded as a snapshot. If you do not accept an amendment, your remedy is to terminate
        under clause 19.1 before it takes effect; continuing to list Services after that date constitutes acceptance.
      </p>
      <p>
        <strong>5.7 Plan limits.</strong> Your Plan may limit the maximum price of a Service, the number of Services,
        or other features. Current limits are published on the Platform and in the Fee Schedule.
      </p>
    </Section>

    <Section title="6. Invoicing and GST">
      <p>
        <strong>6.1 If you are GST-registered.</strong> You will issue Book A Sloth a valid tax invoice complying with
        the CGST Rules for each Booking or group of Bookings, showing your GSTIN, our GSTIN as recipient, the taxable
        value H, and GST at the applicable rate. We may generate a draft invoice for your adoption; adopting it does
        not transfer responsibility for its accuracy to us.
      </p>
      <p>
        <strong>6.2 Your filing obligation.</strong> You will report each such invoice in your GSTR-1 within the
        statutory period, and will discharge the corresponding output tax, so that input tax credit is available to
        Book A Sloth in the ordinary course.
      </p>
      <p>
        <strong>6.3 Recovery of denied credit.</strong> If input tax credit is denied to, reversed against, or delayed
        for Book A Sloth because you failed to file, failed to pay, filed late, or issued a defective or non-compliant
        invoice, the full amount of that credit, together with any interest and penalty imposed on Book A Sloth, is a
        debt due from you and is recoverable under clause 9. We may withhold payment of the GST component of any
        invoice until it appears in our GSTR-2B.
      </p>
      <p>
        <strong>6.4 If you are not GST-registered.</strong> Book A Sloth will issue you a <strong>Payment Advice</strong>{' '}
        recording the Host Consideration payable. A Payment Advice is <strong>not</strong> a tax invoice, carries no GST
        component, and gives rise to no input tax credit. You must not represent it as a tax invoice.
      </p>
      <p>
        <strong>6.5 Change of status.</strong> You will notify us within <strong>7 days</strong> of becoming registered
        or deregistered under GST. A change applies <strong>prospectively only</strong>, from the date we record it. It
        is never applied retrospectively to Bookings already confirmed, and no adjustment is payable in respect of
        them.
      </p>
      <p>
        <strong>6.6 Name matching.</strong> The legal name against your GSTIN must match the name on your Host account
        and bank records. We may withhold payment until any mismatch is resolved, and you are responsible for any
        credit denied as a result.
      </p>
      <p>
        <strong>6.7 Your own taxes.</strong> You are solely responsible for your own income tax, GST, professional tax,
        and any other tax on the amounts you receive, and for your own returns, records, and registrations.
      </p>
    </Section>

    <Section title="7. Payment terms">
      <p>
        <strong>7.1 Cycle.</strong> Book A Sloth operates <strong>two Payment Cycles per calendar month</strong>. A
        Booking is included in a cycle only if the Service was <strong>completed at least 7 days before the cycle
        cut-off</strong> and the applicable cancellation and dispute window has closed.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-2 border-gray-200 rounded-xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2.5 font-semibold text-ink border-b-2 border-gray-200">Services completed</th>
              <th className="text-left p-2.5 font-semibold text-ink border-b-2 border-gray-200">Cut-off</th>
              <th className="text-left p-2.5 font-semibold text-ink border-b-2 border-gray-200">Paid on or before</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr><td className="p-2.5 border-b border-gray-100">1st &ndash; 15th</td><td className="p-2.5 border-b border-gray-100">15th</td><td className="p-2.5 border-b border-gray-100">last working day of that month</td></tr>
            <tr><td className="p-2.5">16th &ndash; end of month</td><td className="p-2.5">last day of month</td><td className="p-2.5">15th of the following month</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        <strong>7.2 Minimum payment threshold.</strong> Where the net amount payable in a cycle is less than{' '}
        <strong>₹500</strong>, it is carried forward and paid in the first cycle in which the cumulative balance
        reaches that threshold, or on termination, whichever is earlier.
      </p>
      <p>
        <strong>7.3 Security holdback.</strong> For the first <strong>90 days</strong> of your Host account, or the
        first 20 completed Bookings, whichever is later, Book A Sloth may retain a holdback of up to{' '}
        <strong>10%</strong> of each amount otherwise payable. The holdback is applied against amounts recoverable
        under clause 9 and any unapplied balance is released in the first cycle after that period ends. The holdback is
        not a deposit, bears no interest, and is not a charge for services.
      </p>
      <p>
        <strong>7.4 Right to defer.</strong> Book A Sloth may withhold or defer payment of any amount, in whole or in
        part, where: a Guest complaint, refund request, chargeback, or investigation relating to you is open; we
        reasonably suspect fraud, misrepresentation, or breach of clause 4; your KYC, PAN, bank, or GST details are
        incomplete, unverified, or inconsistent; or we are required to do so by law or by a payment provider, bank, or
        authority. We will notify you and release any amount not properly applied under clause 9 once the matter is
        resolved.
      </p>
      <p>
        <strong>7.5 Method.</strong> Payment is made by electronic transfer to the verified bank account on your Host
        account, net of the deductions in clauses 8 and 9. Payment to that account discharges our obligation in full.
        You are responsible for the accuracy of those details, and for any loss caused by details you supplied
        incorrectly.
      </p>
      <p>
        <strong>7.6 No interest.</strong> No interest is payable on any amount held, deferred, carried forward, or paid
        late, save where a court or arbitrator directs otherwise.
      </p>
      <p>
        <strong>7.7 Statements and queries.</strong> Statements are available on your Host dashboard. You must raise any
        query on a statement within <strong>30 days</strong> of it becoming available. After that period the statement
        is treated as accepted, save in the case of manifest error or fraud.
      </p>
    </Section>

    <Section title="8. Tax deducted at source">
      <p>
        <strong>8.1</strong> Book A Sloth will deduct income tax at source from payments to you where required by the
        Income-tax Act, 1961, and will deposit it and issue you the applicable TDS certificate (Form 16A) within the
        statutory timelines.
      </p>
      <p>
        <strong>8.2</strong> TDS is <strong>not a charge by Book A Sloth</strong> and is not retained by us. It is tax
        deposited to your credit against your PAN, and you may claim it in your income tax return.
      </p>
      <p>
        <strong>8.3 PAN is mandatory.</strong> You must provide a valid PAN before your first payment. Without one, tax
        is deductible at the higher rate prescribed by section 206AA of the Income-tax Act, 1961, and Book A Sloth has
        no liability for the resulting difference. We may withhold all payment until a valid PAN is on file.
      </p>
      <p>
        <strong>8.4</strong> If any tax, interest, or penalty is later demanded from Book A Sloth in respect of
        payments made to you, including as a result of an incorrect PAN, an incorrect declaration, or your failure to
        report income, that amount is recoverable from you under clause 9.
      </p>
    </Section>

    <Section title="9. Set-off and recovery">
      <p>
        <strong>9.1</strong> Book A Sloth may deduct, set off, or recover from any amount payable to you (whether under
        this Agreement or otherwise, and whether or not then due) any of the following:
      </p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>refunds, price reductions, or credits given to a Guest in respect of a Booking you supplied or failed to supply;</li>
        <li>chargebacks, payment reversals, and the associated fees levied by any bank or payment provider;</li>
        <li>a handling charge of <strong>₹500</strong> per chargeback or per Guest complaint upheld against you;</li>
        <li>input tax credit denied, reversed, or delayed under clause 6.3, with interest and penalty;</li>
        <li>tax, interest, or penalty demanded under clause 8.4;</li>
        <li>subscription fees, Plan charges, and any other sum you owe us;</li>
        <li>amounts payable under the indemnity in clause 17;</li>
        <li>any overpayment, duplicate payment, or amount paid in error;</li>
        <li>liquidated damages under clause 15.3.</li>
      </ul>
      <p>
        <strong>9.2</strong> If the amounts recoverable exceed the amounts payable to you, the balance is a debt due
        and payable on demand within 15 days, and Book A Sloth may apply the holdback under clause 7.3, suspend your
        account, and pursue recovery.
      </p>
      <p>
        <strong>9.3</strong> This clause is in addition to, and not in substitution for, any other right or remedy
        available to Book A Sloth.
      </p>
    </Section>

    <Section title="10. Guest-facing responsibility and complaints">
      <p>
        <strong>10.1</strong> Because Book A Sloth is the supplier of record, Guest complaints, refund requests, and
        consumer claims are addressed to and handled by Book A Sloth. Its decision on whether to refund a Guest is
        final as between Book A Sloth and the Guest.
      </p>
      <p>
        <strong>10.2</strong> As between Book A Sloth and you, you remain responsible for any complaint, refund,
        liability, cost, or claim arising from your act, omission, delay, conduct, or the standard of your performance,
        and the resulting amounts are recoverable under clause 9.
      </p>
      <p>
        <strong>10.3</strong> You will cooperate fully and promptly with any investigation, provide the information and
        records we reasonably request within <strong>3 working days</strong>, and will not contact a Guest about a
        dispute except through the Platform or as we direct.
      </p>
      <p>
        <strong>10.4</strong> You will not settle, admit, compromise, or make any payment in respect of any Guest claim
        without our prior written consent.
      </p>
    </Section>

    <Section title="11. Standards, availability, and quality">
      <ul className="list-disc pl-5 space-y-1.5">
        <li>You will keep your published availability accurate and will not accept Bookings you cannot honour.</li>
        <li>You will join or attend at the scheduled start time and will deliver the full advertised duration.</li>
        <li>You will maintain the equipment, connectivity, premises, and hygiene and safety standards appropriate to the Service.</li>
        <li>Where the Service is delivered in person, you will comply with all applicable safety, accessibility, and licensing requirements at the location.</li>
        <li>Book A Sloth may set and publish reasonable minimum quality, response-time, and reliability standards, and may reflect performance against them in Platform ranking and visibility.</li>
      </ul>
    </Section>

    <Section title="12. Cancellation and non-performance by you">
      <p>
        <strong>12.1</strong> You may cancel a confirmed Booking only for a genuine and unavoidable reason, and must do
        so through the Platform at the earliest opportunity.
      </p>
      <p>
        <strong>12.2</strong> Where you cancel or fail to attend, the Guest receives a full refund of the Guest Price,
        including the Booking Charge and Payment Processing Charge, and no Host Consideration is payable to you for
        that Booking.
      </p>
      <p>
        <strong>12.3</strong> In addition, Book A Sloth may recover under clause 9 the payment-processing cost it
        incurs on the refund, together with a handling charge of <strong>₹250</strong> per cancellation or non-attendance
        attributable to you.
      </p>
      <p>
        <strong>12.4</strong> Repeated cancellation or non-attendance is a material breach. Book A Sloth may restrict
        your visibility, limit your listings, suspend your account, or terminate under clause 19.2.
      </p>
      <p>
        <strong>12.5</strong> Cancellation by the Guest is governed by the{' '}
        <Link to="/refund" className="text-primary hover:underline">Refund &amp; Cancellation Policy</Link>. Where a
        Guest cancels within a window in which the Service is treated as non-refundable, the Host Consideration remains
        payable to you in accordance with that Policy.
      </p>
    </Section>

    <Section title="13. Data protection">
      <p>
        <strong>13.1</strong> Guest personal data made available to you through the Platform is disclosed solely so you
        can perform the Booking. Book A Sloth is the Data Fiduciary in respect of that data and you process it on our
        instructions and on our behalf.
      </p>
      <p>
        <strong>13.2</strong> You will: use that data only to perform the Booking; not use it for marketing,
        solicitation, resale, profiling, or any other purpose; keep it confidential and secure with appropriate
        technical and organisational measures; not retain it longer than necessary; not transfer it outside India
        except as permitted by law; and delete it on request or on termination.
      </p>
      <p>
        <strong>13.3</strong> You will notify us at <Mail /> <strong>within 24 hours</strong> of becoming aware of any
        personal data breach affecting Guest data, and will cooperate with any notification we are required to make
        under the Digital Personal Data Protection Act, 2023 and the rules under it.
      </p>
      <p>
        <strong>13.4</strong> Breach of this clause 13 is a material breach permitting immediate suspension and
        termination, and any penalty imposed on Book A Sloth as a result is recoverable under clauses 9 and 17.
      </p>
    </Section>

    <Section title="14. Confidentiality and intellectual property">
      <p>
        <strong>14.1</strong> You will keep confidential all non-public information about the Platform, its pricing,
        its systems, its users, and its business that you obtain under this Agreement, and will not disclose or use it
        except to perform this Agreement. This obligation survives termination for 3 years.
      </p>
      <p>
        <strong>14.2</strong> You retain ownership of the content you upload. You grant Book A Sloth a non-exclusive,
        worldwide, royalty-free, sub-licensable licence to host, reproduce, adapt for formatting, display, and
        distribute that content, and to use your name, business name, likeness, and listing content, to operate,
        market, and promote the Platform and the Services. This licence survives termination in respect of content
        already published or included in archived, cached, or promotional material.
      </p>
      <p>
        <strong>14.3</strong> You warrant that you own or are licensed to use everything you upload and that it
        infringes no third-party right.
      </p>
      <p>
        <strong>14.4</strong> Book A Sloth retains all rights in the Platform, its software, design, data, and brand.
        Nothing in this Agreement grants you any right in them beyond the limited right to use the Platform under the{' '}
        <Link to="/terms" className="text-primary hover:underline">Terms of Use</Link>.
      </p>
    </Section>

    <Section title="15. Off-platform dealing">
      <p>
        <strong>15.1</strong> You will not accept, request, or encourage payment directly from a Guest for a Booking
        made or initiated through the Platform, and will not direct a Guest to pay by any means outside the Platform.
      </p>
      <p>
        <strong>15.2</strong> For <strong>12 months</strong> after a Guest first books you through the Platform, you
        will not solicit or knowingly accept a booking from that Guest outside the Platform for a service of the same
        or a similar kind. This does not apply to a Guest with whom you had a pre-existing, documented client
        relationship before their first Platform Booking.
      </p>
      <p>
        <strong>15.3 Liquidated damages.</strong> Breach of clause 15.1 or 15.2 causes loss that is difficult to
        quantify. You agree to pay, as a genuine pre-estimate of that loss and not as a penalty, an amount equal to{' '}
        <strong>three times the Booking Charge and Platform Commission</strong> that would have applied had the booking
        been made through the Platform, subject to a maximum of <strong>₹10,000</strong> per breach. This is
        recoverable under clause 9 and is without prejudice to termination under clause 19.2.
      </p>
      <p>
        <strong>15.4</strong> Clause 15.1 also protects the integrity of the arrangement described in clause 2. Taking
        payment directly for a Platform Booking would misrepresent who supplied the Service and is treated as a
        material breach.
      </p>
    </Section>

    <Section title="16. No collection on either's behalf">
      <p>
        Neither party collects, holds, or receives money as agent, trustee, or nominee for the other. Money received by
        Book A Sloth from a Guest is received as the seller of the Service and is Book A Sloth&rsquo;s own revenue.
        Money paid by Book A Sloth to you is paid as consideration for your supply to Book A Sloth against your invoice
        or Payment Advice. Nothing in this Agreement is to be read as creating a settlement, escrow, trust, or
        pass-through arrangement in respect of any Guest payment.
      </p>
    </Section>

    <Section title="17. Indemnity">
      <p>
        You will indemnify, defend, and hold harmless Book A Sloth, Timewheel Internet Private Limited, and their
        directors, officers, employees, and agents from and against all claims, demands, proceedings, losses, damages,
        liabilities, fines, penalties, taxes, and costs (including reasonable legal fees) arising out of or in
        connection with:
      </p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>your supply, non-supply, or defective supply of any Service;</li>
        <li>any injury, loss, or damage caused to any person or property in the course of a Service;</li>
        <li>your breach of this Agreement or of any applicable law, licence, or professional obligation;</li>
        <li>any claim that your content infringes a third-party right;</li>
        <li>any claim by a Guest, regulator, or authority arising from your act or omission;</li>
        <li>any tax, interest, or penalty referred to in clauses 6.3 or 8.4.</li>
      </ul>
      <p>This clause survives termination.</p>
    </Section>

    <Section title="18. Our liability to you">
      <p>
        <strong>18.1</strong> The Platform is provided on an <strong>&ldquo;as is&rdquo; and &ldquo;as
        available&rdquo;</strong> basis. We do not warrant that it will be uninterrupted, error-free, or secure, or
        that it will generate any level of bookings or income for you.
      </p>
      <p>
        <strong>18.2</strong> We are not liable to you for indirect, incidental, special, consequential, or punitive
        loss, or for loss of profit, revenue, business, goodwill, opportunity, or data.
      </p>
      <p>
        <strong>18.3</strong> Our total aggregate liability to you for all claims arising out of or relating to this
        Agreement is limited to the total Booking Charges and Platform Commission actually retained by us from you in
        the <strong>three months</strong> preceding the event giving rise to the claim, or <strong>₹10,000</strong>,
        whichever is lower.
      </p>
      <p>
        <strong>18.4</strong> Nothing in this clause excludes or limits liability that cannot be excluded or limited
        under applicable law, including liability for fraud.
      </p>
    </Section>

    <Section title="19. Term, suspension, and termination">
      <p>
        <strong>19.1</strong> This Agreement begins on your acceptance and continues until terminated. You may
        terminate on <strong>30 days&rsquo;</strong> written notice to <Mail />, provided you first honour or properly
        cancel all confirmed Bookings.
      </p>
      <p>
        <strong>19.2</strong> Book A Sloth may terminate on 30 days&rsquo; notice for convenience, or{' '}
        <strong>immediately and without notice</strong> where you breach clause 4, 13, 15, or 16, where we reasonably
        suspect fraud, illegality, or risk to Guests, or where required by law or by a payment provider, bank, or
        authority.
      </p>
      <p>
        <strong>19.3 Suspension.</strong> We may suspend your listings, your account, or payment to you at any time,
        with or without notice, where we reasonably consider it necessary to protect Guests, the Platform, or
        ourselves. Suspension is not a termination and does not limit any other remedy.
      </p>
      <p>
        <strong>19.4 On termination:</strong> confirmed Bookings must still be honoured or will be refunded to the
        Guest at your cost under clause 12; amounts properly due to you are paid in the next Payment Cycle after all
        cancellation, dispute, and chargeback windows have closed, which may be up to <strong>120 days</strong> after
        the last Booking; and amounts recoverable under clause 9 remain recoverable.
      </p>
      <p>
        <strong>19.5</strong> Clauses 2, 6.3, 8.4, 9, 10.2, 13, 14, 15, 16, 17, 18, 20, and 21 survive termination.
      </p>
    </Section>

    <Section title="20. Dispute resolution and governing law">
      <p>
        <strong>20.1</strong> This Agreement is governed by the laws of India.
      </p>
      <p>
        <strong>20.2 Escalation.</strong> Before commencing any proceeding, the parties will attempt in good faith to
        resolve the dispute by written notice to <Mail /> and a discussion within 15 days of that notice.
      </p>
      <p>
        <strong>20.3 Arbitration.</strong> Any dispute not resolved under clause 20.2 will be referred to and finally
        resolved by arbitration under the Arbitration and Conciliation Act, 1996, by a <strong>sole arbitrator</strong>{' '}
        appointed by Book A Sloth, with the <strong>seat and venue at Nagpur, Maharashtra</strong>, conducted in
        English. Each party bears its own costs unless the arbitrator directs otherwise. The award is final and binding.
      </p>
      <p>
        <strong>20.4</strong> Subject to clause 20.3, the courts at <strong>Nagpur, Maharashtra</strong> have exclusive
        jurisdiction.
      </p>
      <p>
        <strong>20.5</strong> This clause applies to disputes between Book A Sloth and a Host in a business capacity.
        It does not affect any right a consumer has under the Consumer Protection Act, 2019.
      </p>
    </Section>

    <Section title="21. General">
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Entire agreement.</strong> This Agreement, the Fee Schedule, the Terms of Use, and the Privacy Policy are the entire agreement between the parties on this subject and supersede all prior understandings and representations.</li>
        <li><strong>Amendment.</strong> We may amend this Agreement on 30 days&rsquo; notice. Continuing to list Services after the notice period constitutes acceptance. Fee changes follow clause 5.6.</li>
        <li><strong>Assignment.</strong> You may not assign or subcontract this Agreement without our written consent. We may assign it to any group company or in connection with a merger, reorganisation, or sale of business.</li>
        <li><strong>Severability.</strong> If any provision is held invalid or unenforceable, it is severed to the minimum extent necessary and the remainder continues in full force.</li>
        <li><strong>No waiver.</strong> A failure or delay in exercising a right is not a waiver of it.</li>
        <li><strong>Force majeure.</strong> Neither party is liable for failure to perform caused by an event beyond its reasonable control, but this does not excuse an obligation to pay money.</li>
        <li><strong>Notices.</strong> Notices to you are validly given by email to the address on your Host account or by in-Platform notification. Notices to us must go to <Mail />.</li>
        <li><strong>Language.</strong> The English version of this Agreement governs.</li>
      </ul>
    </Section>

    <Section title="22. Contact and grievance">
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Grievance Officer:</strong> Shubham Narendra Datarkar</li>
        <li><strong>Email:</strong> <Mail /></li>
        <li><strong>Phone:</strong> +91 8637758344</li>
        <li><strong>Registered office:</strong> Ground Floor, Holding No-55, Ward No-19, Natapada, Jajpur Road, Byasanagar, District Jajpur, Odisha &ndash; 755019, India</li>
        <li><strong>Operations office:</strong> #6, 2nd Floor, Eureka Coworking, Mate Square, Nagpur, Maharashtra</li>
      </ul>
      <p className="pt-1"><strong>Timewheel Internet Private Limited</strong> (CIN: U62012OD2026PTC052654 | GSTIN: 21AAMCT8270C1ZF)</p>
    </Section>
  </LegalLayout>
);

export default HostAgreement;
