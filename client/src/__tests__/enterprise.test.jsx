import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FAQ, FEATURE_CATEGORIES, INDUSTRIES, DEPLOYMENTS } from '../pages/enterprise/enterpriseData';
import * as ENTERPRISE_DATA from '../pages/enterprise/enterpriseData';
import EnterpriseFaq from '../pages/enterprise/EnterpriseFaq';
import EnterpriseLeadForm from '../pages/enterprise/EnterpriseLeadForm';
import { buildEnterpriseJsonLd, ENT_SEO } from '../pages/enterprise/enterpriseSeo';
import Enterprise from '../pages/Enterprise';

const { mockTrack } = vi.hoisted(() => ({ mockTrack: vi.fn() }));
vi.mock('../services/analytics', () => ({
  analytics: { track: mockTrack },
  EVENTS: { ENTERPRISE_FAQ_OPENED: 'enterprise_faq_opened', ENTERPRISE_LEAD_SUBMITTED: 'enterprise_lead_submitted' },
}));

const { mockSubmit } = vi.hoisted(() => ({ mockSubmit: vi.fn(() => Promise.resolve({ data: { ok: true } })) }));
vi.mock('../services/api', () => ({ submitEnterpriseLead: mockSubmit }));
import { submitEnterpriseLead } from '../services/api';

describe('enterpriseData', () => {
  it('has at least 20 FAQ with non-empty answers', () => {
    expect(FAQ.length).toBeGreaterThanOrEqual(20);
    FAQ.forEach(f => { expect(f.q.length).toBeGreaterThan(0); expect(f.a.length).toBeGreaterThan(20); });
  });
  it('has 6 feature categories with items', () => {
    expect(FEATURE_CATEGORIES).toHaveLength(6);
    FEATURE_CATEGORIES.forEach(c => expect(c.items.length).toBeGreaterThan(0));
  });
  it('has 8 industries with challenge + solution', () => {
    expect(INDUSTRIES).toHaveLength(8);
    INDUSTRIES.forEach(i => { expect(i.challenge).toBeTruthy(); expect(i.solution).toBeTruthy(); });
  });
  it('marks on-premise as coming soon', () => {
    expect(DEPLOYMENTS.find(d => d.name === 'On-premise').badge).toBe('Coming Soon');
  });
  it('uses no banned marketing words', () => {
    const banned = /\b(amazing|revolutionary|magic|easy|best|ultimate)\b/i;
    expect(banned.test(JSON.stringify(ENTERPRISE_DATA))).toBe(false);
  });
});

describe('EnterpriseFaq', () => {
  beforeEach(() => mockTrack.mockClear());

  it('toggles aria-expanded on click', () => {
    const items = [{ q: 'Q one', a: 'Answer one text here.' }];
    const { getByRole } = render(<EnterpriseFaq items={items} idPrefix="t" />);
    const btn = getByRole('button', { name: /Q one/ });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('wires aria-controls to the panel id', () => {
    const items = [{ q: 'Q one', a: 'Answer one text here.' }];
    const { getByRole, container } = render(<EnterpriseFaq items={items} idPrefix="t" />);
    const btn = getByRole('button', { name: /Q one/ });
    expect(btn.getAttribute('aria-controls')).toBe('t-panel-0');
    fireEvent.click(btn);
    const panel = container.querySelector('#t-panel-0');
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.textContent).toContain('Answer one text here.');
  });

  it('fires analytics only on open, not on close, when trackOpen is set', () => {
    const items = [{ q: 'Track me', a: 'Some answer.' }];
    const { getByRole } = render(<EnterpriseFaq items={items} idPrefix="t" trackOpen />);
    const btn = getByRole('button', { name: /Track me/ });
    fireEvent.click(btn); // open
    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith('enterprise_faq_opened', { question: 'Track me' });
    fireEvent.click(btn); // close
    expect(mockTrack).toHaveBeenCalledTimes(1);
    fireEvent.click(btn); // re-open — must track again
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('does not fire analytics when trackOpen is falsy', () => {
    const items = [{ q: 'Silent', a: 'Some answer.' }];
    const { getByRole } = render(<EnterpriseFaq items={items} idPrefix="t" />);
    fireEvent.click(getByRole('button', { name: /Silent/ }));
    expect(mockTrack).not.toHaveBeenCalled();
  });
});

describe('enterpriseSeo', () => {
  it('emits an @graph with FAQPage (>=20 Q&A) and named SoftwareApplication', () => {
    const graph = buildEnterpriseJsonLd()['@graph'];
    const faq = graph.find(n => n['@type'] === 'FAQPage');
    const app = graph.find(n => n['@type'] === 'SoftwareApplication');
    const org = graph.find(n => n['@type'] === 'Organization');
    const breadcrumb = graph.find(n => n['@type'] === 'BreadcrumbList');
    expect(app.name).toBe('Book A Sloth Enterprise');
    expect(faq.mainEntity.length).toBeGreaterThanOrEqual(20);
    expect(org).toBeTruthy();
    expect(breadcrumb.itemListElement.length).toBe(2);
    // Builder docs are nested under @graph, so their own @context must be stripped.
    graph.forEach(node => expect(node['@context']).toBeUndefined());
  });

  it('title targets the primary keyword', () => {
    expect(ENT_SEO.title.toLowerCase()).toContain('appointment booking app');
  });
});

describe('EnterpriseLeadForm', () => {
  beforeEach(() => {
    mockSubmit.mockClear();
    mockTrack.mockClear();
  });

  it('blocks submit when required fields are empty', () => {
    const { getByRole, getByText } = render(<EnterpriseLeadForm />);
    fireEvent.click(getByRole('button', { name: /Request Enterprise Consultation/ }));
    expect(submitEnterpriseLead).not.toHaveBeenCalled();
    getByText('Enter your organization name.');
  });

  it('submits when required fields are filled', async () => {
    const { getByLabelText, getByRole } = render(<EnterpriseLeadForm />);
    fireEvent.change(getByLabelText(/Organization Name/i), { target: { value: 'Acme' } });
    fireEvent.change(getByLabelText(/Business Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(getByLabelText(/Phone/i), { target: { value: '9876543210' } });
    fireEvent.click(getByRole('button', { name: /Request Enterprise Consultation/ }));
    await waitFor(() => expect(submitEnterpriseLead).toHaveBeenCalledTimes(1));
  });
});

describe('Enterprise page', () => {
  it('renders exactly one h1 with the hero headline', () => {
    const { container } = render(<MemoryRouter><Enterprise /></MemoryRouter>);
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toMatch(/Built around your business/);
  });
});
