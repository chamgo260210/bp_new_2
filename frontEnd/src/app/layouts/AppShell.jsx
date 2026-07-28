import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../../features/auth/AuthProvider.jsx';
import { useProjects } from '../../features/projects/hooks/useProjects.js';
import { Button, Drawer, ToastRegion } from '../../shared/ui/index.js';
import './layouts.css';

function AccountMenu({ user, onLogout, onClose }) {
  return (
    <div className="app-account-menu" role="menu" aria-label="계정 메뉴">
      <strong>{user?.displayName || user?.username}</strong>
      <span>{user?.username}</span>
      <Link to="/app/settings" role="menuitem" onClick={onClose}>설정</Link>
      <Button variant="outline" size="small" role="menuitem" onClick={onLogout}>로그아웃</Button>
    </div>
  );
}

function ProjectSearch({ onChoose }) {
  const { status, projects } = useProjects();
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized || status !== 'success') return [];
    return projects.filter((project) => [project.name, project.industryCategory, project.description]
      .join(' ').toLowerCase().includes(normalized)).slice(0, 6);
  }, [projects, query, status]);

  return (
    <label className="app-project-search">
      <span className="visually-hidden">프로젝트 검색</span>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="프로젝트 검색" />
      {visible.length > 0 && (
        <ul>
          {visible.map((project) => (
            <li key={project.projectId}>
              <Link to={`/app/projects/${project.projectId}`} onClick={() => { setQuery(''); onChoose?.(); }}>
                <strong>{project.name}</strong>
                <span>{project.industryCategory || '사업 분야 미입력'}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}

function GlobalNavigation({ onNavigate }) {
  return (
    <nav className="app-global-nav" aria-label="주요 메뉴">
      <NavLink to="/app/projects" onClick={onNavigate}>Projects</NavLink>
    </nav>
  );
}

export default function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  async function handleLogout() {
    await logout();
    navigate('/auth/login', {
      replace: true,
      state: { authTransition: true, source: 'logout', intent: 'login' },
    });
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>
      <header className="app-topbar">
        <Link className="app-brand" to="/app/projects"><span aria-hidden="true">V</span>Venture Verify</Link>
        <GlobalNavigation />
        <div className="app-topbar__actions">
          <ProjectSearch />
          <button type="button" className="app-account-trigger" aria-label="계정 메뉴" aria-expanded={accountOpen} onClick={() => setAccountOpen((open) => !open)}>
            {user?.displayName || user?.username || '계정'}
          </button>
          {accountOpen && <AccountMenu user={user} onLogout={handleLogout} onClose={() => setAccountOpen(false)} />}
        </div>
        <button type="button" className="app-mobile-menu" aria-label="메뉴 열기" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>☰</button>
      </header>
      <main id="main-content" className="app-main" tabIndex="-1"><Outlet /></main>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="메뉴">
        <GlobalNavigation onNavigate={() => setDrawerOpen(false)} />
        <ProjectSearch onChoose={() => setDrawerOpen(false)} />
        <Link className="app-drawer-new" to="/app/projects/new" onClick={() => setDrawerOpen(false)}>새 프로젝트</Link>
        <AccountMenu user={user} onLogout={handleLogout} onClose={() => setDrawerOpen(false)} />
      </Drawer>
      <ToastRegion />
    </div>
  );
}
