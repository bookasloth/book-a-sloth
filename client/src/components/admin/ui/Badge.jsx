// client/src/components/admin/ui/Badge.jsx
const Badge = ({ tone = 'neutral', children }) => (
  <span className={`adm-badge adm-badge-${tone}`}>{children}</span>
);
export default Badge;
