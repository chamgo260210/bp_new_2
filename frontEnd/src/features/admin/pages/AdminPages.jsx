import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../../shared/ui/index.js';
import { useApiClient } from '../../../shared/api/ApiClientProvider.jsx';
import { createAdminApi } from '../api/adminApi.js';
import AdminActionConfirmDialog from '../components/AdminActionConfirmDialog.jsx';
import { useServicePolicy } from '../../service-policy/useServicePolicy.js';
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
const SETTING_COPY = {
  REGISTRATION_ENABLED: ['신규 회원가입', '새 사용자 계정 생성을 허용합니다.'],
  DOCUMENT_PROCESSING_ENABLED: ['문서 처리', '사업계획서 업로드와 분석 작업 시작을 허용합니다.'],
  MAINTENANCE_MODE: ['유지보수 모드', '일반 사용자 작업을 일시 중지하고 관리자 접근은 유지합니다.'],
};

export function AdminOverviewPage() {
  const client = useApiClient(); const api = useMemo(() => createAdminApi(client), [client]); const { data, loading, error, refresh } = useRemote(api.overview, api);
  if (loading) return <div className="admin-page"><PageHeader title="Overview">운영 지표를 불러오는 중입니다.</PageHeader></div>;
  if (error) return <div className="admin-page"><PageHeader title="Overview" /><Failure error={error} retry={refresh} /></div>;
  return <div className="admin-page"><PageHeader title="Overview">현재 운영 상태와 즉시 확인이 필요한 항목을 보여줍니다.</PageHeader><section className="admin-metrics" aria-label="운영 지표"><Metric label="전체 사용자" value={data.users.total} /><Metric label="활성 사용자" value={data.users.active} /><Metric label="잠긴 계정" value={data.users.locked} /><Metric label="전체 프로젝트" value={data.projects.total} /><Metric label="실패 작업" value={data.jobs.failed} /><Metric label="AI 작업" value={data.jobs.available ? data.jobs.running : '미연동'} /></section><section className="admin-panel"><h2>AI 서비스</h2><p>{data.jobs.available ? '작업 상태를 확인할 수 있습니다.' : 'AI 서버 미연동 — 현재 수집하지 않는 지표입니다.'}</p></section></div>;
}

export function AdminAuditPage() { const client = useApiClient(); const api = useMemo(() => createAdminApi(client), [client]); const { data, loading, error, refresh } = useRemote(() => api.audit({ page: 0, size: 50 }), api); return <div className="admin-page"><PageHeader title="Audit">관리자 변경은 사유, 변경 전후 값, 요청 ID와 함께 보존됩니다.</PageHeader><section className="admin-panel">{loading ? <p>불러오는 중…</p> : error ? <Failure error={error} retry={refresh} /> : <table className="admin-table"><thead><tr><th>시각</th><th>액션</th><th>대상</th><th>요청 ID</th><th>메타데이터</th></tr></thead><tbody>{data.content.map((event) => <tr key={event.id}><td>{new Date(event.occurredAt).toLocaleString()}</td><td>{event.action}</td><td>{event.aggregateType} #{event.aggregateId || '—'}</td><td>{event.requestId || '—'}</td><td>{event.metadata || '—'}</td></tr>)}</tbody></table>}</section></div>; }

export function AdminSettingsPage() { const client=useApiClient();const api=useMemo(()=>createAdminApi(client),[client]);const {refresh:refreshPolicy}=useServicePolicy();const {data,loading,error,refresh}=useRemote(api.settings,api);const [pending,setPending]=useState(null);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');async function confirm({reason,password}){setBusy(true);try{const secure=pending.key==='MAINTENANCE_MODE'&&pending.value==='true';const token=secure?(await api.reauthenticateAdmin({password,purpose:'MAINTENANCE_MODE_ENABLE'})).actionToken:undefined;await api.updateSetting(pending.key,{value:pending.value,reason},token);if(pending.key==='MAINTENANCE_MODE'||pending.key==='DOCUMENT_PROCESSING_ENABLED')void refreshPolicy().catch(()=>undefined);setPending(null);setNotice(`${pending.label} 설정이 변경되었습니다.`);refresh();}finally{setBusy(false);}}return <div className="admin-page"><PageHeader title="Settings">지원되는 서비스 설정과 기능 플래그만 변경할 수 있습니다.</PageHeader>{notice&&<p className="admin-success" role="status">{notice}</p>}<section className="admin-panel">{loading?<p>불러오는 중…</p>:error?<Failure error={error} retry={refresh}/>:data.map((s)=>{const c=SETTING_COPY[s.key]||[s.key,''];const value=s.value==='true'?'false':'true';return <div key={s.key} className="admin-actions"><span><strong>{c[0]}</strong><br/><small>{c[1]} 현재 상태: {s.value==='true'?'활성':'비활성'} · 마지막 변경: {s.updatedAt?new Date(s.updatedAt).toLocaleString():'없음'} · 변경자: {s.updatedBy??'—'}</small></span><Button size="small" onClick={()=>setPending({key:s.key,value,label:c[0],current:s.value})}>{s.value==='true'?'비활성화':'활성화'}</Button></div>;})}</section>{pending&&<AdminActionConfirmDialog open title={`${pending.label} 변경`} description={pending.key==='MAINTENANCE_MODE'&&pending.value==='true'?'일반 사용자의 프로젝트 변경과 분석 시작이 중지됩니다. 기존 데이터 조회와 관리자 콘솔 접근은 유지됩니다.':'설정 변경 사유를 입력해 주세요.'} targetLabel={pending.label} currentState={pending.current==='true'?'활성':'비활성'} nextState={pending.value==='true'?'활성':'비활성'} purpose="MAINTENANCE_MODE_ENABLE" requiresReauthentication={pending.key==='MAINTENANCE_MODE'&&pending.value==='true'} busy={busy} onCancel={()=>setPending(null)} onConfirm={confirm}/>}</div>; }

export function AdminOperationsPage() { const client = useApiClient(); const api = useMemo(() => createAdminApi(client), [client]); const { data, loading } = useRemote(api.services, api); return <div className="admin-page"><PageHeader title="Operations">백엔드, 데이터베이스, AI 연동 상태를 확인합니다.</PageHeader><section className="admin-panel"><h2>AI Service Registry</h2><p>{loading ? '상태 확인 중…' : data.available ? 'AI 서비스가 연결되었습니다.' : 'AI 서버 미연동 — 연동 준비 중입니다.'}</p></section></div>; }
export function AdminJobsPage() { const client = useApiClient(); const api = useMemo(() => createAdminApi(client), [client]); const { data, loading } = useRemote(api.jobs, api); return <div className="admin-page"><PageHeader title="AI Jobs">AI 서버가 연결되면 대기·실행·실패·재시도 상태가 표시됩니다.</PageHeader><section className="admin-panel"><p>{loading ? '작업 상태 확인 중…' : data.available ? '작업 목록을 불러왔습니다.' : 'AI 작업 관리가 아직 연결되지 않았습니다. Mock 작업 데이터는 표시하지 않습니다.'}</p></section></div>; }
