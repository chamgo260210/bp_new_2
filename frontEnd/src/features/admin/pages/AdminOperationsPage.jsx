import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../shared/api/ApiClientProvider.jsx';
import { createAdminApi } from '../api/adminApi.js';
import AdminAvailabilityNotice from '../components/AdminAvailabilityNotice.jsx';
import AdminErrorState from '../components/AdminErrorState.jsx';
import AdminPageHeader from '../components/AdminPageHeader.jsx';
import useAdminResource from '../hooks/useAdminResource.js';
import '../admin.css';

export default function AdminOperationsPage() {
  const client = useApiClient();
  const api = useMemo(() => createAdminApi(client), [client]);
  const request = useCallback((signal) => api.services({ signal }), [api]);
  const { data, loading, error, refresh } = useAdminResource(request);
  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Operations"
        description="현재 연결된 운영 서비스의 가용성만 표시합니다."
      />
      {loading && <section className="admin-panel" aria-busy="true">서비스 상태를 확인하는 중입니다.</section>}
      {error && <AdminErrorState error={error} onRetry={refresh} />}
      {data && <AdminAvailabilityNotice title="AI Service Registry" availability={data} />}
    </div>
  );
}
