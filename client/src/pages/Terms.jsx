import { Link } from 'react-router-dom';
import LegalLayout, { Section } from '../components/common/LegalLayout';

// /terms — Terms & Conditions (aligned with India DPDP Act 2023 + DPDP Rules 2025).
const Mail = () => <a href="mailto:team@timewheel.co.in" className="text-primary hover:underline">team@timewheel.co.in</a>;

const Terms = () => (
  <LegalLayout
    title="Terms & Conditions"
    updated="3 July 2026"
    current="/terms"
    description="The terms governing your use of Book A Sloth — accounts, bookings, payments, and host listings. Read before you book or list a service."
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
          these Terms, our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, and our{' '}
          <Link to="/refund" className="text-primary hover:underline">Refund &amp; Cancellation Policy</Link>. If you do
          not agree, do not use the Platform.
        </p>
      </>
    }
  >
    <Section title="1. Definitions">
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>"Host"</strong> — a user who publishes services or digital products and accepts bookings and payments through the Platform.</li>
        <li><strong>"Guest"</strong> — a user who books services or buys products from a host. A guest may use the Platform with a registered account or by verifying via one-time password (OTP).</li>
        <li><strong>"User", "you"</strong> — any host, guest, or visitor.</li>
        <li><strong>"Services"</strong> — the appointment, consultation, group session, paid DM, or digital product offered by a host.</li>
        <li><strong>"Platform Services"</strong> — the technology, hosting, payment facilitation, and tools we provide.</li>
      </ul>
    </Section>

    <Section title="2. What Book A Sloth is (and is not)">
      <p>
        Book A Sloth is a <strong>technology platform</strong> that lets hosts publish services, manage availability,
        and accept bookings and payments, and lets guests discover and book those services.
      </p>
      <p>
        We are an intermediary. The contract for any service or product is <strong>directly between the host and the
        guest</strong>. We are not the provider of the host's services, we do not control their quality, legality, or
        delivery, and we are not a party to the host–guest contract except as the operator of the Platform and
        facilitator of payments.
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
      <p>If you list services as a host, you agree that:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>You will provide accurate descriptions, pricing, duration, and availability for your services.</li>
        <li>You are solely responsible for delivering your services lawfully, professionally, and as described.</li>
        <li>You hold all licences, registrations, and qualifications required to offer your services.</li>
        <li>You will honour confirmed bookings or handle cancellations/reschedules fairly and in line with the <Link to="/refund" className="text-primary hover:underline">Refund &amp; Cancellation Policy</Link>.</li>
        <li>You will use guest personal data only to deliver the booking, keep it confidential and secure, not retain it longer than needed, and comply with applicable data-protection law including the <strong>DPDP Act, 2023</strong> and DPDP Rules, 2025 (see <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>).</li>
        <li>You are responsible for your own tax obligations, including GST where applicable, on the income you earn.</li>
        <li>You will not list services that are illegal, harmful, deceptive, infringing, or that violate Section 7.</li>
      </ul>
    </Section>

    <Section title="5. Guest obligations">
      <p>If you book as a guest, you agree that:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>You will provide accurate booking details and attend or cancel bookings responsibly.</li>
        <li>You understand the service is delivered by the host, not by Book A Sloth.</li>
        <li>You will treat hosts respectfully and comply with any reasonable requirements they set for the service.</li>
        <li>You are responsible for any equipment, connectivity, or location needed to receive the service.</li>
      </ul>
    </Section>

    <Section title="6. Bookings, payments, fees, and payouts">
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Booking.</strong> A booking is confirmed when payment (where required) is completed and the Platform confirms the booking. Free bookings are confirmed on submission.</li>
        <li><strong>Payments.</strong> All payments are processed by <strong>Razorpay</strong>. By paying, you agree to Razorpay's terms. We do not store your full payment details (see <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, Section 6).</li>
        <li><strong>Platform fees and commission.</strong> We may charge hosts a platform fee and/or commission on transactions, and charge for paid plans (e.g. Host+, Studio). Applicable fees, commission rates, and plan prices are shown on the Platform and may include GST. Fee snapshots are recorded at the time of each transaction.</li>
        <li><strong>Payouts.</strong> Amounts owed to hosts (net of fees, commission, and applicable taxes) are settled through the payout process described on the Platform. We may withhold or adjust payouts to cover refunds, chargebacks, fraud, or amounts owed to us.</li>
        <li><strong>Taxes.</strong> Each party is responsible for its own taxes. We will collect and remit taxes only where required by law.</li>
        <li><strong>Refunds.</strong> Refunds are governed by the <Link to="/refund" className="text-primary hover:underline">Refund &amp; Cancellation Policy</Link>.</li>
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
        The Platform is provided <strong>"as is" and "as available"</strong> without warranties of any kind, whether
        express or implied, to the maximum extent permitted by law. We do not warrant that the Platform will be
        uninterrupted, error-free, or secure, or that hosts' services will meet your expectations. We do not endorse
        any host or guarantee the quality, safety, or legality of any service offered through the Platform.
      </p>
    </Section>

    <Section title="12. Limitation of liability">
      <p>To the maximum extent permitted by applicable law:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Book A Sloth is not liable for the acts, omissions, services, or content of any host or guest.</li>
        <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, goodwill, or opportunity.</li>
        <li>Our total aggregate liability to you for any claim arising out of or relating to the Platform or these Terms will not exceed the total platform fees or commission you paid to us in the <strong>three (3) months</strong> preceding the event giving rise to the claim, or <strong>INR 5,000</strong>, whichever is lower.</li>
      </ul>
      <p>Nothing in these Terms excludes liability that cannot be excluded under applicable law.</p>
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
        These Terms are governed by the laws of <strong>India</strong>. Subject to any mandatory consumer-protection
        rights you may have, the courts at <strong>Jajpur, Odisha</strong> will have exclusive jurisdiction over any
        dispute arising out of or relating to these Terms or the Platform.
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
