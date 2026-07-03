import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../../components/admin/ui';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import Ic from '../../components/admin/Ic';
import { IC } from '../../components/admin/adminNav';
import { DEPT_META, linksForDept } from '../../components/admin/deptRegistry';

// Department hub — one param route (/admin/dept/:dept) serves all departments.
// Each renders a 5-per-row grid of cards for the admin destinations tagged to it
// in deptRegistry.js. A destination can appear in several departments.
const DeptCard = ({ card }) => {
  // Inactive cards are parked placeholders — greyed, non-clickable, "Soon" pill.
  if (card.inactive) {
    return (
      <div className="adm-card rounded-xl p-3 flex items-start gap-2.5 opacity-55 cursor-default select-none">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--adm-hover)]">
          <Ic d={IC[card.icon]} size={15} className="adm-t3" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[12.5px] font-semibold adm-t2 leading-4 truncate">{card.label}</h3>
            <span className="text-[8.5px] font-bold uppercase tracking-wide adm-t3 border border-[var(--adm-border)] rounded px-1 py-px leading-none flex-shrink-0">Soon</span>
          </div>
          <p className="text-[10.5px] adm-t3 mt-0.5 leading-tight">{card.desc}</p>
        </div>
      </div>
    );
  }
  return (
    <Link
      to={card.to}
      className="group adm-card rounded-xl p-3 flex items-start gap-2.5 transition-colors hover:border-[#FE5100]/40
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100]/50"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--adm-hover)] transition-colors group-hover:bg-[#FE5100]/10">
        <Ic d={IC[card.icon]} size={15} className="adm-t2 transition-colors group-hover:text-[#FE5100]" />
      </div>
      <div className="min-w-0">
        <h3 className="text-[12.5px] font-semibold adm-t1 leading-4 truncate">{card.label}</h3>
        <p className="text-[10.5px] adm-t3 mt-0.5 leading-tight">{card.desc}</p>
      </div>
    </Link>
  );
};

const AdminDepartment = () => {
  const { dept } = useParams();
  const meta = DEPT_META[dept];

  if (!meta) {
    return (
      <div>
        <PageHeader title="Department" subtitle="Unknown department." />
        <AdminEmptyState
          icon={IC.alert}
          title="Department not found"
          description={`No department matches "${dept}".`}
          ctaLabel="Back to Dashboard"
          ctaHref="/super-dashboard"
        />
      </div>
    );
  }

  const cards = linksForDept(dept);

  return (
    <div>
      <PageHeader title={meta.label} subtitle={meta.blurb} />
      {cards.length === 0 ? (
        <AdminEmptyState
          badge="Coming Soon"
          icon={IC[meta.icon]}
          title={`${meta.label} department`}
          description="No tools are assigned to this department yet."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
          {cards.map((card) => (
            <DeptCard key={card.to || card.label} card={card} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDepartment;
