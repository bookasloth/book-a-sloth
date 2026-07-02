// client/src/components/admin/ui/Btn.jsx
import Ic from '../Ic';

const VARIANTS = {
  primary: 'bg-[#FE5100] text-white hover:bg-[#e54900]',
  outline: 'adm-card adm-t2 adm-hoverable',
  ghost:   'adm-t2 adm-hoverable',
  danger:  'bg-red-600 text-white hover:bg-red-700',
};

const Btn = ({ variant = 'primary', size = 'md', icon, children, className = '', ...rest }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100]/50
      disabled:opacity-50 disabled:cursor-not-allowed
      ${size === 'sm' ? 'px-3 py-1.5 text-[12.5px]' : 'px-4 py-2.5 text-sm'}
      ${VARIANTS[variant]} ${className}`}
    {...rest}
  >
    {icon && <Ic d={icon} size={size === 'sm' ? 13 : 15} />}
    {children}
  </button>
);
export default Btn;
