import { Link } from 'react-router-dom';
import useDocumentMeta from '../hooks/useDocumentMeta';

/**
 * /contact (+ /get-in-touch) — placeholder landing for the WhatsApp "Get in
 * touch" deep-link. Direct creator contact isn't built yet; this resolves to a
 * friendly "coming soon" page instead of falling through to the /:profileSlug
 * catch-all ("Creator not found"). Mirror of Support.jsx — point the AiSensy
 * template button at /contact.
 */
const Contact = () => {
  useDocumentMeta({ title: 'Contact | Book A Sloth' });
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary mb-3">Contact</p>
      <h1 className="text-4xl sm:text-5xl font-bold text-ink mb-4">Coming soon</h1>
      <p className="max-w-md text-sm text-gray-500 mb-6">
        Direct creator contact isn't available just yet. We're building it and
        will enable it in a future update — thanks for your patience.
      </p>
      <Link to="/" className="text-primary hover:underline text-sm">Go home</Link>
    </div>
  );
};

export default Contact;
