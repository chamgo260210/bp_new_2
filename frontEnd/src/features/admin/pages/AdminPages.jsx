import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../../shared/ui/index.js';
import { useApiClient } from '../../../shared/api/ApiClientProvider.jsx';
import { createAdminApi } from '../api/adminApi.js';
import '../admin.css';

function useRemote(load, key) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((current) => current + 1), []);
  // The caller supplies key as the explicit reload contract; load may be an inline request factory.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { let active = true; Promise.resolve().then(load).then((data) => { if (active) setState({ loading: false, data, error: null }); }).catch((error) => { if (active) setState({ loading: false, data: null, error }); }); return () => { active = false; }; }, [key, revision]);
  return { ...state, refresh };
}
function PageHeader({ title, children }) { return <header className="admin-page-header"><h1>{title}</h1>{children && <p>{children}</p>}</header>; }
function Failure({ error, retry }) { return <div className="admin-panel admin-error">{error?.message || '데이터를 불러오지 못했습니다.'} <Button size="small" variant="outline" onClick={retry}>다시 시도</Button></div>; }
function Metric({ label, value }) { return <div className="admin-metric"><span>{label}</span><strong>{value ?? '—'}</strong></div>; }
export function AdminOverviewPage() {
  const client = useApiClient(); const api = useMemo(() => createAdminApi(client), [client]); const { data, loading, error, refresh } = useRemote(api.overview, api);
  if (loading) return <div className="admin-page"><PageHeader title="Overview">운영 지표를 불러오는 중입니다.</PageHeader></div>;
  if (error) return <div className="admin-page"><PageHeader title="Overview" /><Failure error={error} retry={refresh} /></div>;
  return <div className="admin-page"><PageHeader title="Overview">현재 운영 상태와 즉시 확인이 필요한 항목을 보여줍니다.</PageHeader><section className="admin-metrics" aria-label="운영 지표"><Metric label="전체 사용자" value={data.users.total} /><Metric label="활성 사용자" value={data.users.active} /><Metric label="잠긴 계정" value={data.users.locked} /><Metric label="전체 프로젝트" value={data.projects.total} /><Metric label="실패 작업" value={data.jobs.failed} /><Metric label="AI 작업" value={data.jobs.available ? data.jobs.running : '미연동'} /></section><section className="admin-panel"><h2>AI 서비스</h2><p>{data.jobs.available ? '작업 상태를 확인할 수 있습니다.' : 'AI 서버 미연동 — 현재 수집하지 않는 지표입니다.'}</p></section></div>;
}

export function AdminOperationsPage() { const client = useApiClient(); const api = useMemo(() => createAdminApi(client), [client]); const { data, loading } = useRemote(api.services, api); return <div className="admin-page"><PageHeader title="Operations">백엔드, 데이터베이스, AI 연동 상태를 확인합니다.</PageHeader><section className="admin-panel"><h2>AI Service Registry</h2><p>{loading ? '상태 확인 중…' : data.available ? 'AI 서비스가 연결되었습니다.' : 'AI 서버 미연동 — 연동 준비 중입니다.'}</p></section></div>; }
export function AdminJobsPage() { const client = useApiClient(); const api = useMemo(() => createAdminApi(client), [client]); const { data, loading } = useRemote(api.jobs, api); return <div className="admin-page"><PageHeader title="AI Jobs">AI 서버가 연결되면 대기·실행·실패·재시도 상태가 표시됩니다.</PageHeader><section className="admin-panel"><p>{loading ? '작업 상태 확인 중…' : data.available ? '작업 목록을 불러왔습니다.' : 'AI 작업 관리가 아직 연결되지 않았습니다. Mock 작업 데이터는 표시하지 않습니다.'}</p></section></div>; }
