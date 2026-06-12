import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="text-center py-20">
    <h1 className="text-5xl font-bold text-gray-300 mb-4">404</h1>
    <p className="text-gray-500 mb-6">Page not found</p>
    <Link to="/" className="text-primary hover:underline text-sm">Go home</Link>
  </div>
);

export default NotFound;
