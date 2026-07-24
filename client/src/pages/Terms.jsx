import { Link } from 'react-router-dom';
import LegalLayout, { Section, MOR_EFFECTIVE } from '../components/common/LegalLayout';

// /terms — Terms of Use. Umbrella terms for everyone (accounts, acceptable use, IP,
// liability). The commercial contracts live separately: /guest-terms is the sale
// contract with the guest, /host-agreement is the procurement contract with the host.
//
// Section 2 is load-bearing. Book A Sloth is the SELLER OF RECORD, not an intermediary.
// The previous version said "We are an intermediary. The contract is directly between
// the host and the guest" — that contradicts the GST position and the host agreement.
// Do not reintroduce intermediary or marketplace language anywhere on this page.
const Mail = () => <a href="mailto:team@timewheel.co.in" className="text-primary hover:underline">team@timewheel.co.in</a>;

const Terms = () => (
  <LegalLayout
    title="Terms of Use"
    updated="24 July 2026"
    effective={MOR_EFFECTIVE}
    current="/terms"
    description="The terms governing your use of Book A Sloth — accounts, acceptable use, content, and liability. Read before you book or list a service."
    intro={
      <>
        <p>
          These Terms &amp; Conditions ("Terms") govern your access to and use of the Book A Sloth platform,
          website, and related services (the "Platform"), operated by <strong>Timewheel Internet Private Limited</strong>{' '}
          (CIN: U62012OD2026PTC052654, GSTIN: 21AAMCT8270C1ZF) ("Book A Sloth", "we", "us", or "our"), a company
          incorporated in India under the Companies Act, 2013 with its registered office at <strong>Ground Floor,
          Holding No-55, Ward No-19, Natapada, Jajpur Road, Byasanagar, District Jajpur, Odisha – 755019, India</strong>.
        </p>
        <p>
          By creating an account, booking a service, listing a service, or otherwise using the Platform, you agree to
          these Terms and our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. If you
          do not agree, do not use the Platform.
        </p>
        <p className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
          <strong>These Terms cover using the Platform. Your commercial contract is elsewhere.</strong>
          <br />
          If you are <strong>buying</strong>, your contract is the{' '}
          <Link to="/guest-terms" className="text-primary hover:underline">Guest Terms of Sale</Link>, together with the{' '}
          <Link to="/refund" className="text-primary hover:underline">Refund &amp; Cancellation Policy</Link>.
          <br />
          If you are <strong>selling</strong>, your contract is the{' '}
          <Link to="/host-agreement" className="text-primary hover:underline">Host Services Agreement</Link>, together
          with the <Link to="/host-fees" className="text-primary hover:underline">Host Fee &amp; Payment Schedule</Link>.
          <br />
          Where those documents conflict with these Terms on a commercial matter, they prevail.
        </p>
      </>
    }
  >
    <Section title="1. Definitions">
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>"Host"</strong> — a person or business that supplies services to Book A Sloth for onward sale, under the <Link to="/host-agreement" className="text-primary hover:underline">Host Services Agreement</Link>.</li>
        <li><strong>"Guest"</strong> — a customer who buys a service from Book A Sloth. A guest may use the Platform with a registered account or by verifying via one-time password (OTP).</li>
        <li><strong>"User", "you"</strong> — any host, guest, or visitor.</li>
        <li><strong>"Services"</strong> — the appointment, consultation, group session, paid DM, or digital product sold through the Platform.</li>
        <li><strong>"Platform"</strong> — the website, applications, tools, and systems we operate.</li>
      </ul>
    </Section>

    <Section title="2. What Book A Sloth is">
      <p>
        <strong>2.1</strong> Book A Sloth <strong>buys services from hosts and sells them to guests in its own name and
        on its own account</strong>. We are the <strong>seller and supplier of record</strong> for every paid booking
        made through the Platform.
      </p>
      <p>
        <strong>2.2</strong> A guest&rsquo;s contract is with Book A Sloth, not with the host. A host&rsquo;s contract
        is with Book A Sloth, not with the guest. There is no contract between a host and a guest in respect of a
        booking.
      </p>
      <p>
        <strong>2.3</strong> The host named on a listing is the person who will perform the service. Naming them
        identifies who performs it; it does not make them the seller.
      </p>
      <p>
        <strong>2.4</strong> We issue the guest a tax invoice under our own GSTIN for the full amount, and we purchase
        the service from the host against the host&rsquo;s invoice. Money received from a guest is our own revenue and
        is not collected, held, or settled on behalf of any host.
      </p>
      <p>
        <strong>2.5</strong> Because we are the seller, complaints, refunds, and consumer claims relating to a booking
        are addressed to and handled by us. Guests do not need to pursue hosts.
      </p>
      <p>
        <strong>2.6</strong> We are not an employer of hosts. Hosts are independent contractors who supply to us.
      </p>
    </Section>

    <Section title="3. Eligibility and accounts">
      <ul className="list-disc pl-5 space-y-1.5">
        <li>You must be at least <strong>18 years old</strong> and capable of entering into a binding contract under Indian law to use the Platform.</li>
        <li>You agree to provide accurate, current, and complete information and to keep it updated.</li>
        <li>You are responsible for safeguarding your account credentials and OTPs, and for all activity under your account.</li>
        <li>Notify us promptly at <Mail /> of any unauthorised use of your account.</li>
        <li>We may suspend or terminate accounts that violate these Terms or applicable law.</li>
      </ul>
    </Section>

    <Section title="4. Host obligations">
      <p>
        Hosts are governed by the{' '}
        <Link to="/host-agreement" className="text-primary hover:underline">Host Services Agreement</Link> and the{' '}
        <Link to="/host-fees" className="text-primary hover:underline">Host Fee &amp; Payment Schedule</Link>, which
        set out pricing, invoicing, payment cycles, deductions, and termination in full. In summary, if you supply
        services as a host you agree that:
      </p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>You supply your services <strong>to Book A Sloth</strong>, which sells them onward to guests. You have no contract with the guest and must not tell a guest otherwise.</li>
        <li>You will provide accurate descriptions, pricing, duration, and availability for your services.</li>
        <li>You are responsible to us for delivering your services lawfully, professionally, safely, and as described.</li>
        <li>You hold all licences, registrations, and qualifications required to offer your services.</li>
        <li>You will honour confirmed bookings, and cancellations by you are dealt with under clause 12 of the Host Services Agreement.</li>
        <li>You will not take payment directly from a guest for a booking made or initiated through the Platform.</li>
        <li>You will use guest personal data only to deliver the booking, keep it confidential and secure, not retain it longer than needed, and comply with applicable data-protection law including the <strong>DPDP Act, 2023</strong> and DPDP Rules, 2025 (see <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>).</li>
        <li>You are responsible for your own tax obligations, including GST where applicable, on the income you earn.</li>
        <li>You will not list services that are illegal, harmful, deceptive, infringing, or that violate Section 7.</li>
      </ul>
    </Section>

    <Section title="5. Guest obligations">
      <p>If you book as a guest, you agree that:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>You will provide accurate booking details and attend or cancel bookings responsibly.</li>
        <li>You understand you are buying from Book A Sloth, and that the host named on the listing performs the service as our service partner.</li>
        <li>You will treat the person performing the service respectfully and comply with any reasonable requirements notified for it.</li>
        <li>You are responsible for any equipment, connectivity, or location needed to receive the service.</li>
        <li>You will not arrange to pay outside the Platform for a booking started on it. If you do, our Guest Terms of Sale, Refund Policy, and support do not apply to that transaction.</li>
      </ul>
      <p>
        Your purchase is governed in full by the{' '}
        <Link to="/guest-terms" className="text-primary hover:underline">Guest Terms of Sale</Link>.
      </p>
    </Section>

    <Section title="6. Bookings, payments, and taxes">
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Booking.</strong> A booking is confirmed when payment (where required) is completed and the Platform confirms it. Free bookings are confirmed on submission.</li>
        <li><strong>Payments.</strong> Payments are processed by <strong>Razorpay</strong> on our behalf, into an account operated by us as the seller. By paying, you agree to Razorpay's terms. We do not store your full payment details (see <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, Section 6).</li>
        <li><strong>Price.</strong> The price shown at checkout is the total payable and is inclusive of GST. It is itemised before you pay. We issue the guest a tax invoice under our GSTIN for the full amount.</li>
        <li><strong>Purchases from hosts.</strong> We purchase each service from the host against the host's invoice or payment advice, at the consideration computed under the <Link to="/host-fees" className="text-primary hover:underline">Host Fee &amp; Payment Schedule</Link>, less any deduction we are entitled to make under the Host Services Agreement. This is a payment to a supplier, not a settlement of money held for anyone.</li>
        <li><strong>Charges to hosts.</strong> Our booking charge, platform commission, and payment processing charge, together with subscription prices for paid plans, are published in the Fee Schedule and on the <Link to="/pricing" className="text-primary hover:underline">Pricing page</Link>. The charges applicable to a booking are recorded as a snapshot when it is confirmed.</li>
        <li><strong>Taxes.</strong> We charge and account for GST on our sale to the guest. Hosts are responsible for their own tax obligations on what they receive. We deduct tax at source from host payments where the law requires it and issue the applicable certificate.</li>
        <li><strong>Refunds.</strong> Governed by the <Link to="/refund" className="text-primary hover:underline">Refund &amp; Cancellation Policy</Link>. As the seller, we make refunds to guests directly.</li>
      </ul>
    </Section>

    <Section title="7. Acceptable use">
      <p>You must not:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Use the Platform for any unlawful, fraudulent, or harmful purpose.</li>
        <li>Post content that is illegal, defamatory, obscene, infringing, misleading, or that violates another person's rights.</li>
        <li>Offer or solicit services that are illegal or prohibited in India.</li>
        <li>Circumvent the Platform to avoid fees, or take payments off-platform for bookings initiated on the Platform.</li>
        <li>Upload viruses or malicious code, or attempt to gain unauthorised access to the Platform, other accounts, or our systems.</li>
        <li>Scrape, copy, or harvest data from the Platform without permission.</li>
        <li>Harass, abuse, or harm other users.</li>
        <li>Submit fake reviews or manipulate ratings.</li>
      </ul>
      <p>We may remove content and suspend or terminate accounts that breach this Section.</p>
    </Section>

    <Section title="8. Content and intellectual property">
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Your content.</strong> You retain ownership of content you upload (profiles, images, descriptions, reviews, products). You grant us a non-exclusive, worldwide, royalty-free licence to host, display, and distribute that content as needed to operate and promote the Platform.</li>
        <li><strong>Your responsibility.</strong> You represent that you own or have the rights to the content you upload and that it does not infringe any third party's rights.</li>
        <li><strong>Our IP.</strong> The Platform, including its software, design, branding, and the "Book A Sloth" name and logo, is owned by us or our licensors and is protected by intellectual property laws. You may not copy, modify, or create derivative works without our written permission.</li>
        <li><strong>Takedown.</strong> If you believe content on the Platform infringes your rights, contact us at <Mail />.</li>
      </ul>
    </Section>

    <Section title="9. Third-party services">
      <p>
        The Platform integrates third-party services including <strong>Razorpay</strong> (payments),{' '}
        <strong>Supabase</strong> (hosting/auth/database/storage), <strong>Google</strong> (calendar and meeting links),{' '}
        and email/messaging providers. Your use of these features
        may be subject to those providers' terms. We are not responsible for third-party services or their availability.
      </p>
    </Section>

    <Section title="10. Reviews">
      <p>
        Guests may leave reviews after a completed booking. Reviews must be honest and based on a genuine experience.
        We may moderate, remove, or decline to publish reviews that violate these Terms, are fraudulent, or contain
        unlawful or abusive content. Reviews reflect the views of users, not of Book A Sloth.
      </p>
    </Section>

    <Section title="11. Disclaimers">
      <p>
        <strong>11.1 The Platform itself</strong> is provided <strong>"as is" and "as available"</strong>, to the
        maximum extent permitted by law. We do not warrant that it will be uninterrupted, error-free, or secure.
      </p>
      <p>
        <strong>11.2 The services we sell</strong> are a different matter. We sell them as the supplier of record and
        we stand behind them &mdash; this clause does not disclaim our responsibility for a service we sold you. That
        responsibility is dealt with in the{' '}
        <Link to="/guest-terms" className="text-primary hover:underline">Guest Terms of Sale</Link> and the{' '}
        <Link to="/refund" className="text-primary hover:underline">Refund &amp; Cancellation Policy</Link>.
      </p>
      <p>
        <strong>11.3</strong> Services are supplied with reasonable skill and care. Unless a listing says so expressly,
        no particular result or outcome is promised, and nothing sold through the Platform is medical, psychological,
        legal, or financial advice unless the listing states that it is and the person performing it holds the
        necessary qualifications.
      </p>
    </Section>

    <Section title="12. Limitation of liability">
      <p>
        <strong>12.1</strong> This clause limits our liability for <strong>use of the Platform</strong>. It does not
        limit our liability as seller for a service we sold you &mdash; that is dealt with in the{' '}
        <Link to="/guest-terms" className="text-primary hover:underline">Guest Terms of Sale</Link>, clause 8.
      </p>
      <p><strong>12.2</strong> To the maximum extent permitted by applicable law:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>We are not liable for the content, conduct, or communications of any user, or for anything a user does outside the Platform.</li>
        <li>We are not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, goodwill, or opportunity.</li>
        <li>Our total aggregate liability for any claim relating to your use of the Platform will not exceed the amounts you paid us in the <strong>three (3) months</strong> preceding the event giving rise to the claim.</li>
      </ul>
      <p>
        <strong>12.3</strong> Nothing in these Terms excludes or limits liability that cannot be excluded under
        applicable law, including any right you have under the <strong>Consumer Protection Act, 2019</strong> and any
        liability for fraud.
      </p>
    </Section>

    <Section title="13. Indemnity">
      <p>
        You agree to indemnify and hold harmless Book A Sloth, its directors, employees, and agents from any claims,
        damages, losses, liabilities, and expenses (including reasonable legal fees) arising out of your use of the
        Platform, your content, your services (if a host), or your breach of these Terms or applicable law.
      </p>
    </Section>

    <Section title="14. Suspension and termination">
      <ul className="list-disc pl-5 space-y-1.5">
        <li>You may stop using the Platform and request account closure at any time.</li>
        <li>We may suspend or terminate your access, with or without notice, if you breach these Terms, create risk or legal exposure, or for prolonged inactivity.</li>
        <li>On termination, provisions that by their nature should survive (including Sections 8, 11, 12, 13, 15, and 16) will continue to apply.</li>
      </ul>
    </Section>

    <Section title="15. Governing law and dispute resolution">
      <p>
        These Terms are governed by the laws of <strong>India</strong>.
      </p>
      <p>
        <strong>Guests.</strong> Nothing here restricts your right as a consumer to bring proceedings in the consumer
        forum having jurisdiction where you reside or work, as provided by the Consumer Protection Act, 2019.
      </p>
      <p>
        <strong>Hosts.</strong> Disputes with hosts are resolved by arbitration seated at Nagpur, Maharashtra, under
        clause 20 of the{' '}
        <Link to="/host-agreement" className="text-primary hover:underline">Host Services Agreement</Link>.
      </p>
      <p>
        <strong>Everyone else.</strong> For any other dispute relating to these Terms or the Platform, the courts at{' '}
        <strong>Nagpur, Maharashtra</strong> have exclusive jurisdiction.
      </p>
      <p>
        Before initiating any formal proceedings, you agree to first contact us at <Mail /> so we can attempt to
        resolve the matter amicably.
      </p>
    </Section>

    <Section title="16. Changes to these Terms">
      <p>
        We may update these Terms from time to time. We will post the revised version with a new "Last updated" date
        and, for material changes, provide additional notice. Your continued use of the Platform after changes take
        effect means you accept the updated Terms.
      </p>
    </Section>

    <Section title="17. Grievance Officer and contact">
      <p>In accordance with the DPDP Act, 2023 and other applicable Indian law, you may contact our Grievance Officer, who will address grievances within the timeframes required by law (within <strong>90 days</strong> for data-protection grievances under the DPDP Rules, 2025):</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Grievance Officer:</strong> Shubham Narendra Datarkar</li>
        <li><strong>Email:</strong> <Mail /></li>
        <li><strong>Phone:</strong> +91 8637758344</li>
        <li><strong>Registered office:</strong> Ground Floor, Holding No-55, Ward No-19, Natapada, Jajpur Road, Byasanagar, District Jajpur, Odisha – 755019, India</li>
        <li><strong>Operations office:</strong> #6, 2nd Floor, Eureka Coworking, Mate Square, Nagpur, Maharashtra</li>
      </ul>
      <p className="pt-1"><strong>Timewheel Internet Private Limited</strong> (CIN: U62012OD2026PTC052654 | GSTIN: 21AAMCT8270C1ZF)</p>
    </Section>
  </LegalLayout>
);

export default Terms;
