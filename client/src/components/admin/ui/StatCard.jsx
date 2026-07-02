// client/src/components/admin/ui/StatCard.jsx
import { Link } from 'react-router-dom';
import Ic from '../Ic';
import { IC } from '../adminNav';

const StatCard = ({ label, value, sub, icon, iconColor, change, to }) => (
  <Link to={to || '#'} className="adm-card rounded-2xl p-5 hover:shadow-sm transition-all group block">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColor || 'bg-gray-400'}`}>
        <Ic d={IC[icon]} size={16} className="text-white" />
      </div>
      {change !== undefined && (
        <span className={`adm-badge ${change >= 0 ? 'adm-badge-ok' : 'adm-badge-danger'}`}>
          <Ic d={change >= 0 ? IC.trendUp : IC.trendDn} size={10} />
          {Math.abs(change)}%
        </span>
      )}
    </div>
    <p className="text-[11px] font-medium adm-t3 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-2xl font-bold adm-t1 tracking-tight">{value}</p>
    {sub && <p className="text-[11px] adm-t3 mt-1">{sub}</p>}
  </Link>
);
export default StatCard;
