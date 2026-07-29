import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../shared/api/ApiClientProvider.jsx';
import { createAdminApi } from '../api/adminApi.js';
import AdminAvailabilityNotice from '../components/AdminAvailabilityNotice.jsx';
import AdminErrorState from '../components/AdminErrorState.jsx';
import AdminPageHeader from '../components/AdminPageHeader.jsx';
import useAdminResource from '../hooks/useAdminResource.js';
import '../admin.css';

export default function AdminJobsPage() {
  const client = useApiClient();
  const api = useMemo(() => createAdminApi(client), [client]);
  const request = useCallback((signal) => api.jobs({ signal }), [api]);
  const { data, loading, error, refresh } = useAdminResource(request);
  return (
    <div className="admin-page">
      <AdminPageHeader
        title="AI Jobs"
        description="AI 서버 연결 전에는 가짜 작업이나 제어 버튼을 표시하지 않습니다."
      />
      {loading && <section className="admin-panel" aria-busy="true">AI 작업 연결 상태를 확인하는 중입니다.</section>}
      {error && <AdminErrorState error={error} onRetry={refresh} />}
      {data && <AdminAvailabilityNotice title="AI 작업" availability={data} />}
    </div>
  );
}
