import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getUserErrorMessage } from '../../shared/api/apiError.js';
import { useApiClient } from '../../shared/api/ApiClientProvider.jsx';
import {
  Alert,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Progress,
  StatusBadge,
  Textarea,
  TextInput,
} from '../../shared/ui/index.js';
import ProjectDashboard from '../report/ProjectDashboard.jsx';
import { createProjectApi } from './api/projectApi.js';
import { useProjectContext } from './ProjectContext.jsx';
import { useProjects } from './hooks/useProjects.js';
import { formatProjectDate } from './model/projectViewModel.js';
import './projects.css';

const stageNumber = {
  DOCUMENT: 1,
  STRUCTURING: 2,
  LEGAL_REVIEW: 3,
  FEASIBILITY: 4,
  PERSONA_CONFIGURATION: 5,
  PANEL_SURVEY: 5,
  PANEL_DISCUSSION: 5,
  REPORT: 6,
  COMPLETED: 6,
};

function filterMatches(project, filter) {
  if (filter === 'all') return true;
  if (filter === 'active') return ['DRAFT', 'ACTIVE', 'PAUSED'].includes(project.status);
  if (filter === 'completed') return project.status === 'COMPLETED';
  return ['DRAFT', 'PAUSED'].includes(project.status);
}

export function ProjectListPage() {
  const { status, projects, retry } = useProjects();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('updated');
  const visible = useMemo(() => projects
    .filter((project) => filterMatches(project, filter)
      && `${project.name} ${project.industryCategory}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'ko');
      if (sort === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }), [projects, query, filter, sort]);

  if (status === 'loading') return <LoadingState label="프로젝트를 불러오고 있습니다" />;
  if (status === 'error') {
    return <ErrorState title="프로젝트를 불러오지 못했습니다" description="네트워크 연결을 확인한 뒤 다시 시도해 주세요." onRetry={retry} />;
  }

  return (
    <div className="project-hub">
      <PageHeader
        eyebrow="내 워크스페이스"
        title="프로젝트"
        description="사업 검증의 입력, 실행, 결과를 프로젝트 단위로 관리합니다."
        actions={<Link className="primary-link" to="/projects/new">새 프로젝트</Link>}
      />
      {!projects.length ? (
        <EmptyState
          title="아직 프로젝트가 없습니다"
          description="첫 사업 검증 프로젝트를 만들어 시작하세요."
          action={<Link className="primary-link" to="/projects/new">프로젝트 만들기</Link>}
        />
      ) : (
        <>
          <div className="project-toolbar">
            <label>
              <span className="visually-hidden">프로젝트 검색</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="프로젝트 또는 사업 분야 검색" />
            </label>
            <div role="group" aria-label="프로젝트 상태 필터">
              {[['all', '전체'], ['active', '진행 중'], ['input', '입력 필요'], ['completed', '완료']].map(([value, label]) => (
                <button key={value} type="button" className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>{label}</button>
              ))}
            </div>
            <select aria-label="프로젝트 정렬" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="updated">최근 수정순</option>
              <option value="created">최근 생성순</option>
              <option value="name">이름순</option>
            </select>
          </div>
          <div className="project-grid">
            {visible.map((project) => {
              const step = stageNumber[project.stage] ?? 1;
              return (
                <article key={project.projectId} className="project-card project-card--hub">
                  <div className="project-card__status"><StatusBadge status={project.status} /><small>{formatProjectDate(project.updatedAt)}</small></div>
                  <h2><Link to={`/projects/${project.projectId}/overview`}>{project.name}</Link></h2>
                  <p>{project.industryCategory || '사업 분야 미입력'}</p>
                  <Progress value={Math.round((step / 6) * 100)} label={`현재 단계 ${project.stageLabel}`} />
                  <div className="project-card__next"><span>다음 행동</span><strong>{project.stageLabel} 계속하기</strong></div>
                  <Link to={`/projects/${project.projectId}/${project.nextRoute}`}>계속하기 →</Link>
                </article>
              );
            })}
          </div>
          {!visible.length && <p className="project-search-empty">조건에 맞는 프로젝트가 없습니다.</p>}
        </>
      )}
    </div>
  );
}

export function ProjectCreatePage() {
  const client = useApiClient();
  const navigate = useNavigate();
  const errorRef = useRef(null);
  const [values, setValues] = useState({ title: '', description: '', industryCategory: '' });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!values.title.trim()) {
      setErrors({ title: '프로젝트 이름을 입력해 주세요.' });
      return;
    }
    setSubmitting(true);
    setGlobalError('');
    try {
      setCreated(await createProjectApi(client).create({
        title: values.title.trim(),
        description: values.description.trim() || null,
        industryCategory: values.industryCategory.trim() || null,
      }));
    } catch (error) {
      setErrors(Object.fromEntries((error.fieldErrors ?? []).map((item) => [item.field, item.message])));
      setGlobalError(getUserErrorMessage(error));
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <section className="project-created">
        <p className="workspace-eyebrow">프로젝트 생성 완료</p>
        <h1>{created.title} 프로젝트가 만들어졌습니다.</h1>
        <p>자동으로 분석을 시작하지 않습니다. 준비한 자료와 시작 방식을 선택해 주세요.</p>
        <div className="project-created__choices">
          <Link to={`/projects/${created.id}/documents`}><strong>사업계획서 업로드</strong><span>PDF, DOCX 등 기존 문서를 분석합니다.</span></Link>
          <Link to={`/projects/${created.id}/input`}><strong>직접 입력</strong><span>사업 개요와 준비 상태를 직접 작성합니다.</span></Link>
          <Link to={`/projects/${created.id}/overview`}><strong>나중에 시작</strong><span>프로젝트 개요로 이동합니다.</span></Link>
        </div>
      </section>
    );
  }

  return (
    <div className="project-create">
      <PageHeader eyebrow="새 프로젝트" title="검증할 사업 아이디어를 만드세요" description="지금은 최소 정보만 필요합니다. 세부 자료와 분석 실행은 프로젝트 안에서 직접 시작합니다." />
      {globalError && <div ref={errorRef} tabIndex="-1"><Alert tone="danger" title="프로젝트를 만들지 못했습니다">{globalError}</Alert></div>}
      <form className="project-form" onSubmit={handleSubmit} noValidate>
        <TextInput id="project-title" label="프로젝트 이름" value={values.title} error={errors.title} maxLength="150" onChange={update('title')} required />
        <TextInput id="project-category" label="사업 분야" description="선택 입력입니다." value={values.industryCategory} error={errors.industryCategory} maxLength="100" onChange={update('industryCategory')} />
        <Textarea id="project-description" label="간단한 설명" description="선택 입력입니다." value={values.description} error={errors.description} maxLength="10000" onChange={update('description')} />
        <div className="project-form__actions">
          <Button type="submit" loading={submitting} disabled={submitting}>프로젝트 만들기</Button>
          <Button type="button" variant="outline" disabled={submitting} onClick={() => navigate('/projects')}>취소</Button>
        </div>
      </form>
    </div>
  );
}

export function ProjectOverviewPage() {
  const { project } = useProjectContext();
  return <ProjectDashboard project={project} />;
}

export function ProjectBriefInputPage() {
  const client = useApiClient();
  const navigate = useNavigate();
  const { project } = useProjectContext();
  const [values, setValues] = useState({
    title: project.name,
    industryCategory: project.industryCategory || '',
    description: project.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving || !values.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      await createProjectApi(client).update(project.projectId, {
        title: values.title.trim(),
        industryCategory: values.industryCategory.trim() || null,
        description: values.description.trim() || null,
      });
      navigate(`/projects/${project.projectId}/overview`);
    } catch (requestError) {
      setError(getUserErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="project-create project-brief-input">
      <PageHeader
        eyebrow="사업계획 입력"
        title="사업 개요를 직접 작성하세요"
        description="현재 단계에서는 프로젝트 기본 정보와 사업 설명을 저장합니다. 상세 계획 문서는 별도로 업로드할 수 있습니다."
        actions={<Link to={`/projects/${project.projectId}/documents`}>문서 업로드로 시작</Link>}
      />
      {error && <Alert tone="danger" title="사업 개요를 저장하지 못했습니다">{error}</Alert>}
      <form className="project-form" onSubmit={handleSubmit} noValidate>
        <TextInput id="project-brief-title" label="프로젝트 이름" value={values.title} maxLength="150" onChange={update('title')} required />
        <TextInput id="project-brief-category" label="사업 분야" value={values.industryCategory} maxLength="100" onChange={update('industryCategory')} />
        <Textarea id="project-brief-description" label="사업 개요" description="누구의 어떤 문제를 어떻게 해결하는지 자유롭게 작성해 주세요." value={values.description} maxLength="10000" onChange={update('description')} />
        <div className="project-form__actions">
          <Button type="submit" loading={saving} disabled={saving}>저장하고 개요로 이동</Button>
          <Button type="button" variant="outline" disabled={saving} onClick={() => navigate(`/projects/${project.projectId}/overview`)}>나중에 작성</Button>
        </div>
      </form>
    </div>
  );
}
