import { NavLink, Outlet, useParams } from 'react-router-dom';

import { Breadcrumb, ErrorState, LoadingState, StatusBadge } from '../../shared/ui/index.js';
import { getProjectNavigation } from '../config/navigation.js';
import { ProjectProvider, useProjectContext } from '../../features/projects/ProjectContext.jsx';

const stageOrder = {
  DOCUMENT: 1,
  STRUCTURING: 2,
  LEGAL_REVIEW: 3,
  FEASIBILITY: 4,
  PERSONA_CONFIGURATION: 5,
  PANEL_SURVEY: 5,
  PANEL_DISCUSSION: 5,
  REPORT: 6,
  COMPLETED: 7,
};

function ProjectLayoutContent() {
  const { projectId } = useParams();
  const { status, project, retry } = useProjectContext();

  if (status === 'loading') return <LoadingState label="프로젝트를 불러오고 있습니다" />;
  if (status === 'error') {
    return (
      <ErrorState
        title="프로젝트를 찾을 수 없습니다"
        description="프로젝트가 없거나 접근 권한이 없습니다."
        onRetry={retry}
      />
    );
  }

  const current = stageOrder[project.stage] ?? 1;

  return (
    <div className="project-workspace">
      <header className="project-workspace__header">
        <Breadcrumb items={[{ label: '프로젝트', to: '/projects' }, { label: project.name }]} />
        <div>
          <div>
            <p>{project.industryCategory || '사업 분야 미입력'} · 최근 수정 {new Date(project.updatedAt).toLocaleDateString('ko-KR')}</p>
            <h1>{project.name}</h1>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </header>

      <nav className="project-step-nav" aria-label="프로젝트 검증 단계">
        {getProjectNavigation(projectId).map((item) => {
          const state = item.stage < current ? 'completed' : item.stage === current ? 'current' : 'upcoming';
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${state}${isActive ? ' is-active' : ''}`}
            >
              <span aria-hidden="true">{state === 'completed' ? '✓' : state === 'current' ? '●' : '○'}</span>
              <span>
                <b>{item.stage}. {item.label}</b>
                <small>{state === 'completed' ? '완료' : state === 'current' ? project.stageLabel : '선행 단계 필요'}</small>
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="project-content"><Outlet /></div>
    </div>
  );
}

export default function ProjectLayout() {
  const { projectId } = useParams();
  return (
    <ProjectProvider projectId={projectId}>
      <ProjectLayoutContent />
    </ProjectProvider>
  );
}
