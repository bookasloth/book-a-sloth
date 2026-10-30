// client/src/components/admin/ui/Skeleton.jsx
// Skeleton loading was removed from the admin UI. This primitive now renders
// nothing, so the 30-odd admin pages that import it stop showing skeleton
// placeholders while data loads (kept as a no-op so no caller needs editing).
const Skeleton = () => null;
export default Skeleton;
