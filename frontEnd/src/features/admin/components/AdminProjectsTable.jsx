import { Link } from 'react-router-dom';

import AdminStatusBadge from './AdminStatusBadge.jsx';

function date(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function AdminProjectsTable({ projects, location }) {
  const returnTo = `${location.pathname}${location.search}`;
  return (
    <div className="admin-table-scroll">
      <table className="admin-table admin-projects-table">
        <caption className="visually-hidden">관리자 프로젝트 목록</caption>
        <thead>
          <tr>
            <th scope="col">프로젝트</th>
            <th scope="col">소유자</th>
            <th scope="col">Area</th>
            <th scope="col">Status</th>
            <th scope="col">Stage</th>
            <th scope="col">업종</th>
            <th scope="col">최근 수정</th>
            <th scope="col">생성일</th>
            <th scope="col">상세</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const destination = `/admin/projects/${project.id}${location.search}`;
            const state = { backgroundLocation: location, returnTo };
            return (
              <tr key={project.id}>
                <td><Link className="admin-user-link" to={destination} state={state}>{project.title}</Link></td>
                <td>
                  {project.owner.displayName || project.owner.username}
                  <small className="admin-table-secondary">@{project.owner.username}</small>
                </td>
                <td>{project.area}</td>
                <td><AdminStatusBadge value={project.status} /></td>
                <td>{project.stage}</td>
                <td>{project.industryCategory || '—'}</td>
                <td><time dateTime={project.updatedAt}>{date(project.updatedAt)}</time></td>
                <td><time dateTime={project.createdAt}>{date(project.createdAt)}</time></td>
                <td>
                  <Link className="admin-detail-link" to={destination} state={state} aria-label={`${project.title} 상세 보기`}>
                    상세
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
