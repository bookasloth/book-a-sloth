import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../../components/admin/ui';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import Ic from '../../components/admin/Ic';
import { IC } from '../../components/admin/adminNav';
import { DEPT_META, linksForDept } from '../../components/admin/deptRegistry';

// Department hub — one param route (/admin/dept/:dept) serves all departments.
// Each renders a 5-per-row grid of cards for the admin destinations tagged to it
// in deptRegistry.js. A destination can appear in several departments.
const DeptCard = ({ card }) => (
  <Link
    to={card.to}
    className="group adm-card rounded-2xl p-5 flex flex-col gap-3 transition-colors hover:border-[#FE5100]/40
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100]/50"
  >
    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--adm-hover)] transition-colors group-hover:bg-[#FE5100]/10">
      <Ic d={IC[card.icon]} size={20} className="adm-t2 transition-colors group-hover:text-[#FE5100]" />
    </div>
    <div className="min-w-0">
      <h3 className="text-[14px] font-semibold adm-t1 leading-5">{card.label}</h3>
      <p className="text-[12px] adm-t3 mt-1 leading-snug">{card.desc}</p>
    </div>
  </Link>
);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {cards.map((card) => (
            <DeptCard key={card.to} card={card} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDepartment;
