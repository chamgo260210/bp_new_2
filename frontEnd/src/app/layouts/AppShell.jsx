import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../features/auth/AuthProvider.jsx';
import { appRoutes, projectRoutes } from '../../features/projects/routing/projectRoutes.js';
import { useProjects } from '../../features/projects/hooks/useProjects.js';
import ProjectStatusHelp from '../../features/projects/components/ProjectStatusHelp.jsx';
import { AppIcon, Button, Drawer, ToastRegion } from '../../shared/ui/index.js';
import './layouts.css';

function userLabel(user) {
  return user?.displayName || user?.username || '계정';
}

function initialFor(user) {
  return Array.from(userLabel(user).trim())[0]?.toUpperCase() || 'V';
}

export function ProfileAvatar({ user, size = 'default' }) {
  return <span className={`profile-avatar profile-avatar--${size}`} aria-hidden="true">{initialFor(user)}</span>;
}

function AccountMenu({ user, onLogout, onSettings }) {
  return (
    <div className="app-account-menu" role="menu" aria-label="계정 메뉴">
      <div className="app-account-menu__identity">
        <ProfileAvatar user={user} size="large" />
        <div><strong>{userLabel(user)}</strong><span>@{user?.username}</span>{user?.email && <small>{user.email}</small>}</div>
      </div>
      <div className="app-account-menu__links">
        <button type="button" role="menuitem" onClick={onSettings}><AppIcon name="settings" />계정 설정</button>
      </div>
      <Button variant="outline" size="small" role="menuitem" onClick={onLogout}>로그아웃</Button>
    </div>
  );
}

function ProjectSearch({ onChoose }) {
  const { status, projects } = useProjects();
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized || status !== 'success') return [];
    return projects.filter((project) => [project.name, project.industryCategory, project.description]
      .filter(Boolean).join(' ').toLocaleLowerCase().includes(normalized)).slice(0, 6);
  }, [projects, query, status]);

  return (
    <label className="app-project-search">
      <span className="visually-hidden">프로젝트 검색</span>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="프로젝트 검색" />
      {visible.length > 0 && <ul role="listbox">{visible.map((project) => <li key={project.projectId}><Link to={projectRoutes.overview(project.projectId)} onClick={() => { setQuery(''); onChoose?.(); }}><strong>{project.name}</strong><span>{project.industryCategory || '사업 분야 미입력'}</span></Link></li>)}</ul>}
    </label>
  );
}

function GlobalNavigation({ onNavigate }) {
  return <nav className="app-global-nav" aria-label="주요 메뉴"><NavLink to={appRoutes.home} end onClick={onNavigate}>Home</NavLink><NavLink to={appRoutes.projects} onClick={onNavigate}>Projects</NavLink></nav>;
}

export default function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountPhase, setAccountPhase] = useState('unmounted');
  const [authTransitionFinished, setAuthTransitionFinished] = useState(false);
  const [logoutTransition, setLogoutTransition] = useState(false);
  const triggerRef = useRef(null);
  const accountMenuRef = useRef(null);
  const accountExitTimer = useRef(null);
  const accountExitAction = useRef(null);
  const previousPathRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pageKey = location.state?.backgroundLocation?.pathname ?? location.pathname;

  const accountOpen = accountPhase !== 'unmounted';
  const finishAccountExit = useCallback(() => {
    window.clearTimeout(accountExitTimer.current);
    const action = accountExitAction.current;
    accountExitAction.current = null;
    setAccountPhase('unmounted');
    requestAnimationFrame(() => triggerRef.current?.focus());
    action?.();
  }, []);
  const closeAccount = useCallback((action) => {
    if (accountPhase === 'unmounted' || accountPhase === 'exiting') return;
    accountExitAction.current = action;
    setAccountPhase('exiting');
    accountExitTimer.current = window.setTimeout(finishAccountExit, 210);
  }, [accountPhase, finishAccountExit]);
  const toggleAccount = () => {
    if (accountPhase === 'unmounted') setAccountPhase('entered');
    else closeAccount();
  };

  useEffect(() => {
    if (!accountOpen) return undefined;
    const onPointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) closeAccount();
    };
    const onKeyDown = (event) => { if (event.key === 'Escape') closeAccount(); };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('keydown', onKeyDown); };
  }, [accountOpen, accountPhase, closeAccount]);

  useEffect(() => () => window.clearTimeout(accountExitTimer.current), []);

  useEffect(() => {
    if (previousPathRef.current && previousPathRef.current !== location.pathname) closeAccount();
    previousPathRef.current = location.pathname;
  }, [closeAccount, location.pathname]);

  useEffect(() => {
    if (location.state?.authSpaceTransition !== 'enter-workspace') return undefined;
    const timer = window.setTimeout(() => setAuthTransitionFinished(true), 780);
    return () => window.clearTimeout(timer);
  }, [location.state?.authSpaceTransition]);

  function handleLogout() {
    closeAccount(async () => {
      setLogoutTransition(true);
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      await logout();
      navigate('/auth/login', { replace: true, state: { authTransition: true, authSpaceTransition: 'enter-login', source: 'logout', intent: 'login' } });
    });
  }

  return (
    <div className="app-shell">
      {(logoutTransition || (location.state?.authSpaceTransition === 'enter-workspace' && !authTransitionFinished)) && <div className="auth-space-transition auth-space-transition--workspace" role="status" aria-live="polite" aria-busy="true"><span aria-hidden="true">V</span><p>{logoutTransition ? '안전하게 로그아웃하고 있습니다.' : '워크스페이스를 준비하고 있습니다.'}</p></div>}
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>
      <header className="app-topbar">
        <Link className="app-brand" to={appRoutes.home}><span aria-hidden="true">V</span>Venture Verify</Link>
        <GlobalNavigation />
        <div className="app-topbar__actions">
          <ProjectSearch />
          <div className="app-account">
            <button ref={triggerRef} type="button" className="app-account-trigger" aria-label="계정 메뉴" aria-haspopup="menu" aria-expanded={accountOpen} onClick={toggleAccount}>
              <ProfileAvatar user={user} /><span><strong>{userLabel(user)}</strong><small>개인 계정</small></span><AppIcon name="chevronRight" className="app-account-trigger__chevron" />
            </button>
            {accountOpen && <div ref={accountMenuRef} className="app-account-menu-wrap" data-phase={accountPhase} onAnimationEnd={(event) => { if (accountPhase === 'exiting' && event.target === event.currentTarget) finishAccountExit(); }}><AccountMenu user={user} onLogout={handleLogout} onSettings={() => closeAccount(() => navigate(appRoutes.profileSettings))} /></div>}
          </div>
        </div>
        <button type="button" className="app-mobile-menu" aria-label="메뉴 열기" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}><AppIcon name="more" /></button>
      </header>
      <main id="main-content" className="app-main" tabIndex="-1"><div key={pageKey} className="app-page-transition"><Outlet /></div></main>
      {(pageKey === appRoutes.home || pageKey === appRoutes.projects) && <ProjectStatusHelp persistent />}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="메뉴">
        <GlobalNavigation onNavigate={() => setDrawerOpen(false)} />
        <ProjectSearch onChoose={() => setDrawerOpen(false)} />
        <Link className="app-drawer-new" to={appRoutes.newProject} onClick={() => setDrawerOpen(false)}>새 프로젝트</Link>
        <AccountMenu user={user} onLogout={handleLogout} onSettings={() => { setDrawerOpen(false); navigate(appRoutes.profileSettings); }} />
      </Drawer>
      <ToastRegion />
    </div>
  );
}
