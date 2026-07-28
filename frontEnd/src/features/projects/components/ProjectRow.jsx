import { Link } from 'react-router-dom';

import { StatusBadge } from '../../../shared/ui/index.js';
import { PROJECT_AREA_DEFINITIONS } from '../model/projectWorkflowModel.js';
import { formatProjectDate } from '../model/projectViewModel.js';
import { projectRoutes } from '../routing/projectRoutes.js';
import { ProjectActionMenu } from '../ProjectSettingsSheet.jsx';

export default function ProjectRow({ project, density = 'default', showNextAction = true, menuOpen = false, onMenuOpenChange, onDelete }) {
  const areaLabel = PROJECT_AREA_DEFINITIONS.find((area) => area.id === project.area)?.label ?? 'Plan';
  return <article className={`project-row project-row--${density} ${menuOpen ? 'project-row--menu-open' : ''}`} role="listitem"><Link className="project-row__main-link" to={projectRoutes.overview(project.projectId)} aria-labelledby={`project-row-title-${project.projectId}`}><div className="project-row__project"><span className="project-row__initial" aria-hidden="true">{Array.from(project.name)[0]}</span><div><h2 id={`project-row-title-${project.projectId}`}>{project.name}</h2><p>{project.industryCategory || '사업 분야 미입력'}</p></div></div><span>{areaLabel}</span><StatusBadge status={project.status} />{showNextAction ? <span className="project-row__next">{project.nextAction.label}</span> : <span className="project-row__next">최근 수정</span>}<time dateTime={project.updatedAt}>{formatProjectDate(project.updatedAt)}</time></Link><ProjectActionMenu project={project} onOpenChange={onMenuOpenChange} onDelete={onDelete} /></article>;
}
