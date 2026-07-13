// Lead-capture form for /enterprise (spec §14: docs/superpowers/specs/2026-07-13-enterprise-landing-design.md).
// Pattern mirrors client/src/pages/Contact.jsx (controlled fields + success state).
// Neutral/calm styling throughout; the submit CTA is the only orange element,
// using the same --ent-cta token EnterpriseFaq.jsx already keys off (Task 4
// owns the actual theme values).
import { useState } from 'react';
import { analytics, EVENTS } from '../../services/analytics';
import { submitEnterpriseLead } from '../../services/api';
import { INDUSTRIES } from './enterpriseData';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEAM_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const LOCATION_COUNTS = ['1', '2-5', '6-20', '21-50', '50+'];

const INITIAL_FORM = {
  orgName: '', website: '', industry: '', teamSize: '', locations: '',
  monthlyBookings: '', currentSoftware: '', integrations: '', phone: '',
  email: '', requirements: '', company_hp: '',
};

function validate(values) {
  const errors = {};
  if (!values.orgName.trim()) errors.orgName = 'Enter your organization name.';
  if (!values.email.trim()) errors.email = 'Enter your business email.';
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!values.phone.trim()) errors.phone = 'Enter your phone number.';
  return errors;
}

export default function EnterpriseLeadForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const fieldId = (key) => `ent-lead-${key}`;
  const errorId = (key) => `ent-lead-${key}-error`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setSubmitError('');
    try {
      await submitEnterpriseLead(form);
      setSent(true);
      analytics.track(EVENTS.ENTERPRISE_LEAD_SUBMITTED);
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Could not send your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Shared text-input renderer: label + input + inline error, wired via
  // htmlFor/id and aria-invalid/aria-describedby.
  const field = (key, label, props = {}) => {
    const error = errors[key];
    return (
      <div>
        <label htmlFor={fieldId(key)} className="block text-sm font-medium mb-1">
          {label}
          {props.required && <span aria-hidden="true" className="text-primary"> *</span>}
        </label>
        <input
          id={fieldId(key)}
          className="fb-input"
          value={form[key]}
          onChange={set(key)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId(key) : undefined}
          {...props}
        />
        {error && <p id={errorId(key)} className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  };

  if (sent) {
    return (
      <div className="page-card w-full max-w-lg p-5 sm:p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Request received</h2>
        <p className="text-sm text-gray-500">
          Thanks — our enterprise team will reach out to <strong>{form.email}</strong> shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="page-card w-full max-w-lg p-5 sm:p-8">
      <h2 className="text-2xl font-bold mb-2">Talk to Enterprise Sales</h2>
      <p className="mb-6 text-sm text-gray-500">
        Tell us about your organization and we'll get back to you with a scoped plan.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Summary banner deliberately avoids the word "required" — the
            Required Integrations field label below already covers that word
            for screen readers/tests; duplicating it here would make every
            error state ambiguous to find by text. */}
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="text-red-500 text-sm">Please check the highlighted fields below.</p>
        )}

        {field('orgName', 'Organization Name', { type: 'text', required: true, maxLength: 200 })}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('website', 'Website', { type: 'url', placeholder: 'https://example.com', maxLength: 300 })}
          <div>
            <label htmlFor={fieldId('industry')} className="block text-sm font-medium mb-1">Industry</label>
            <select id={fieldId('industry')} className="fb-input" value={form.industry} onChange={set('industry')}>
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => <option key={i.name} value={i.name}>{i.name}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={fieldId('teamSize')} className="block text-sm font-medium mb-1">Team Size</label>
            <select id={fieldId('teamSize')} className="fb-input" value={form.teamSize} onChange={set('teamSize')}>
              <option value="">Select team size</option>
              {TEAM_SIZES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={fieldId('locations')} className="block text-sm font-medium mb-1">Locations</label>
            <select id={fieldId('locations')} className="fb-input" value={form.locations} onChange={set('locations')}>
              <option value="">Select locations</option>
              {LOCATION_COUNTS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {field('monthlyBookings', 'Estimated Monthly Bookings', { type: 'text', placeholder: 'e.g. 500' })}
        {field('currentSoftware', 'Current Scheduling Software', { type: 'text', placeholder: 'e.g. spreadsheets, another tool' })}
        {field('integrations', 'Required Integrations', { type: 'text', placeholder: 'e.g. Google Calendar, WhatsApp Business API', maxLength: 300 })}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('phone', 'Phone', { type: 'tel', required: true, placeholder: '+91 98765 43210' })}
          {field('email', 'Business Email', { type: 'email', required: true, placeholder: 'you@company.com' })}
        </div>

        <div>
          <label htmlFor={fieldId('requirements')} className="block text-sm font-medium mb-1">Additional Requirements</label>
          <textarea id={fieldId('requirements')} className="fb-input resize-y" rows={4} maxLength={2000}
            value={form.requirements} onChange={set('requirements')} />
        </div>

        {/* Honeypot — off-screen for humans, left fillable for bots. Server
            rejects the submission if this arrives non-empty. */}
        <div style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true">
          <label htmlFor={fieldId('company_hp')}>Company</label>
          <input
            type="text"
            id={fieldId('company_hp')}
            name="company_hp"
            tabIndex={-1}
            autoComplete="off"
            value={form.company_hp}
            onChange={set('company_hp')}
          />
        </div>

        {submitError && <p role="alert" className="text-red-500 text-sm">{submitError}</p>}

        <button type="submit" disabled={loading}
          className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
          {loading ? 'Sending…' : 'Request Enterprise Consultation'}
        </button>
      </form>
    </div>
  );
}
