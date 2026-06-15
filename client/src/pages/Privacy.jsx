/**
 * /privacy — Privacy Policy. PLACEHOLDER legal copy. Replace with reviewed text
 * before launch (legal sign-off required). Operated by Timewheel Internet (P) Ltd.
 */
const Section = ({ title, children }) => (
  <section className="mb-6">
    <h2 className="text-base font-semibold mb-2">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

const Privacy = () => (
  <div className="app-container py-8 sm:py-12">
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Privacy Policy</h1>
      <p className="text-xs text-gray-400 mb-8">
        Placeholder — pending legal review. Last updated: —
      </p>

      <div className="page-card p-6 sm:p-8">
        <Section title="Who we are">
          <p>
            Book A Sloth is a booking platform operated by Timewheel Internet (P)
            Ltd, Nagpur, India. This policy explains what we collect and how we use it.
          </p>
        </Section>

        <Section title="Information we collect">
          <p>
            Account and profile details, booking information, payment metadata
            (processed by Razorpay — we do not store card numbers), and basic usage
            data needed to run the service.
          </p>
        </Section>

        <Section title="How we use it">
          <p>
            To provide bookings, process payments, send transactional email
            (confirmations, OTPs, receipts), and — only if you haven't opted out —
            occasional marketing and lifecycle email.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can unsubscribe from marketing email at any time via the link in our
            emails; transactional email required for your account will still be sent.
            You may request access to or deletion of your data by contacting us.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions? Email{" "}
            <a href="mailto:support@bookasloth.in" className="text-primary hover:underline">
              support@bookasloth.in
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  </div>
);

export default Privacy;
