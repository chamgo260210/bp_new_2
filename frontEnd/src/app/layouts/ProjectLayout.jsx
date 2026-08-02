import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom';

import { Breadcrumb, ErrorState, LoadingState } from '../../shared/ui/index.js';
import { ProjectProvider, useProjectContext } from '../../features/projects/ProjectContext.jsx';
import { appRoutes, projectRoutes } from '../../features/projects/routing/projectRoutes.js';

const JOURNEY_STEPS = [
  ['아이디어', ''], ['법률 검토', 'legal'], ['콘셉트 생성', 'journey/concept'],
  ['콘셉트 분석', 'journey/concept-analysis'], ['콘셉트 선택', 'journey/concept-selection'],
  ['페르소나', 'journey/persona'], ['인터뷰', 'journey/interview'],
  ['마케팅', 'journey/marketing'], ['최종 보고서', 'journey/final-report'],
];

function ProjectLayoutContent() {
  const { projectId } = useParams();
  const location = useLocation();
  const { status, project, retry } = useProjectContext();
  if (status === 'loading') return <LoadingState label="프로젝트를 불러오고 있습니다" />;
  if (status === 'error') return <ErrorState title="프로젝트를 찾을 수 없습니다" description="프로젝트가 없거나 접근 권한이 없습니다." onRetry={retry} />;

  const base = `/app/projects/${projectId}`;
  const relative = location.pathname.slice(base.length).replace(/^\//, '');
  const currentIndex = Math.max(0, JOURNEY_STEPS.findIndex(([, route]) => route === relative));
  return <div className="journey-shell">
    <header className="journey-shell__header">
      <Breadcrumb items={[{ label: 'Projects', to: appRoutes.projects }, { label: project.name }]} />
      <div className="journey-shell__title"><div><p>{project.industryCategory || '사업 분야 미입력'}</p><h1>{project.name}</h1></div><div><span>현재 단계 · {JOURNEY_STEPS[currentIndex][0]}</span><span>저장 상태는 각 단계에서 확인</span><Link to={projectRoutes.settings(projectId)} state={{ backgroundLocation: location }}>프로젝트 설정</Link></div></div>
    </header>
    <div className="journey-shell__body">
      <aside className="journey-stepper"><p>Business Journey</p><nav aria-label="프로젝트 여정 단계"><ol>{JOURNEY_STEPS.map(([label, route], index) => {
        const stepStatus = index === currentIndex ? '현재' : index < currentIndex ? '완료' : '잠김';
        return <li key={label} className={index === currentIndex ? 'is-active' : index < currentIndex ? 'is-complete' : 'is-locked'}><NavLink to={route ? `${base}/${route}` : base} end={!route}><span>{index + 1}</span><strong>{label}</strong><small>{stepStatus}</small></NavLink></li>;
      })}</ol></nav></aside>
      <main className="journey-shell__main"><Outlet /></main>
    </div>
  </div>;
}

export default function ProjectLayout() {
  const { projectId } = useParams();
  return <ProjectProvider projectId={projectId}><ProjectLayoutContent /></ProjectProvider>;
}
