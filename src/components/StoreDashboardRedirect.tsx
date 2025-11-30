import { Navigate, useParams } from 'react-router-dom';

const StoreDashboardRedirect = () => {
  const { storeId } = useParams();
  return <Navigate to={`/vendor/dashboard/${storeId}`} replace />;
};

export default StoreDashboardRedirect;
