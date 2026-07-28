import { Link, Navigate } from 'react-router-dom';

import { PageHeader } from '../../shared/ui/index.js';
import { useProjectContext } from './ProjectContext.jsx';
import { getProjectBasePath } from './model/projectWorkflowModel.js';

export default function ProjectGetStartedPage() {
  const { project } = useProjectContext();
  const basePath = getProjectBasePath(project.projectId);

  if (project.stage && project.stage !== 'DOCUMENT') {
    return <Navigate to={basePath} replace />;
  }

  return (
    <section className="project-get-started">
      <PageHeader
        eyebrow="Start this project"
        title="어떤 방식으로 시작할까요?"
        description="분석은 자동으로 실행되지 않습니다. 입력 자료를 확인한 뒤 직접 시작할 수 있습니다."
      />
      <div className="project-get-started__choices">
        <Link to={`${basePath}/plan/documents`}>
          <strong>사업계획서 업로드</strong>
          <span>PDF 또는 DOCX 문서를 업로드해 구조화를 시작합니다.</span>
        </Link>
        <Link to={`${basePath}/plan/brief`}>
          <strong>사업 개요 직접 입력</strong>
          <span>프로젝트 이름, 사업 분야와 현재 지원되는 사업 개요를 직접 저장합니다.</span>
        </Link>
        <Link to={basePath}>
          <strong>프로젝트 열기</strong>
          <span>Overview로 이동해 현재 상태와 다음 행동을 확인합니다.</span>
        </Link>
      </div>
    </section>
  );
}
