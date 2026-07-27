import { Link } from 'react-router-dom';

import { Card, ErrorState, LoadingState, Progress, StatusBadge } from '../../shared/ui/index.js';
import { formatProjectDate } from './model/projectViewModel.js';
import { useProjects } from './hooks/useProjects.js';
import './projects.css';

const workflow = ['사업계획 입력', '정보 구조화', '법률·규제 검토', '사업 타당성 분석', 'AI 패널 검증', '통합 보고서'];
const stageIndex = { DOCUMENT: 0, STRUCTURING: 1, LEGAL_REVIEW: 2, FEASIBILITY: 3, PERSONA_CONFIGURATION: 4, PANEL_SURVEY: 4, PANEL_DISCUSSION: 4, REPORT: 5, COMPLETED: 6 };

function NextAction({ project }) {
  const index = stageIndex[project.stage] ?? 0;
  const label = workflow[Math.min(index, workflow.length - 1)];
  return <Card className="workspace-next-action"><div><p>다음 할 일</p><h2>{project.name}</h2><strong>{label}을(를) 계속하세요.</strong><span>현재 단계에 필요한 입력과 결과를 확인한 뒤 다음 검증으로 이어갈 수 있습니다.</span></div><Link className="primary-link" to={`/projects/${project.projectId}/${project.nextRoute}`}>보완하고 계속하기</Link></Card>;
}

export default function WorkspaceHomePage() {
  const { status, projects, retry } = useProjects();
  if (status === 'loading') return <LoadingState label="워크스페이스를 준비하고 있습니다" />;
  if (status === 'error') return <ErrorState title="워크스페이스를 불러오지 못했습니다" description="프로젝트 목록을 다시 확인해 주세요." onRetry={retry} />;
  if (!projects.length) return <section className="workspace-empty"><p className="workspace-eyebrow">내 워크스페이스</p><h1>사업 아이디어를 검증 가능한 프로젝트로 바꿔보세요.</h1><p>문서를 입력하고 핵심 정보를 구조화한 뒤, 근거·위험·다음 행동과 최종 보고서를 하나의 프로젝트에 누적합니다.</p><Link className="primary-link" to="/projects/new">첫 프로젝트 만들기</Link><ol>{workflow.map((item, index) => <li key={item}><b>{index + 1}</b>{item}</li>)}</ol></section>;
  const current = projects[0];
  return <div className="workspace-home"><header className="workspace-home__header"><div><p className="workspace-eyebrow">내 워크스페이스</p><h1>진행 중인 사업 검증을 이어가세요.</h1><span>{projects.length}개 프로젝트를 관리하고 있습니다.</span></div><Link className="primary-link" to="/projects/new">새 프로젝트</Link></header><NextAction project={current} /><section className="workspace-home__section" aria-labelledby="recent-projects"><div className="workspace-section-heading"><h2 id="recent-projects">최근 프로젝트</h2><Link to="/projects">전체 보기</Link></div><div className="workspace-recent-list">{projects.slice(0, 5).map((project) => { const progress = Math.round(((stageIndex[project.stage] ?? 0) / workflow.length) * 100); return <article key={project.projectId}><div><StatusBadge status={project.status} /><h3><Link to={`/projects/${project.projectId}/overview`}>{project.name}</Link></h3><p>{project.industryCategory || '사업 분야 미입력'} · {project.stageLabel}</p></div><div><Progress value={progress} label="검증 진행" /><small>최근 수정 {formatProjectDate(project.updatedAt)}</small></div></article>; })}</div></section></div>;
}
