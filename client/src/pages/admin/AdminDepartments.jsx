import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/admin/ui';
import Ic from '../../components/admin/Ic';
import { IC } from '../../components/admin/adminNav';
import { DEPT_ORDER, DEPT_META, linksForDept } from '../../components/admin/deptRegistry';

// Department index (/admin/dept) — landing grid of all departments. Each card
// links to its hub page (/admin/dept/:dept). Wrapped by AdminLayout, so it
// inherits the admin sidebar + top navbar.
const DeptTile = ({ slug }) => {
  const meta = DEPT_META[slug];
  const count = linksForDept(slug).length;
  return (
    <Link
      to={`/admin/dept/${slug}`}
      className="group adm-card rounded-xl p-3.5 flex flex-col gap-2.5 transition-colors hover:border-[#FE5100]/40
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100]/50"
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--adm-hover)] transition-colors group-hover:bg-[#FE5100]/10">
          <Ic d={IC[meta.icon]} size={17} className="adm-t2 transition-colors group-hover:text-[#FE5100]" />
        </div>
        <span className="text-[10px] font-semibold adm-t3">{count} tool{count === 1 ? '' : 's'}</span>
      </div>
      <div className="min-w-0">
        <h3 className="text-[13.5px] font-bold adm-t1 leading-5">{meta.label}</h3>
        <p className="text-[11px] adm-t3 mt-0.5 leading-snug">{meta.blurb}</p>
      </div>
    </Link>
  );
};

const AdminDepartments = () => (
  <div>
    <PageHeader title="Departments" subtitle="Jump into a department to see its tools." />
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {DEPT_ORDER.map((slug) => (
        <DeptTile key={slug} slug={slug} />
      ))}
    </div>
  </div>
);

export default AdminDepartments;
