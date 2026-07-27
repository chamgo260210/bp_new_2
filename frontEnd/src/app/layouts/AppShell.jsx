import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Button, Drawer, ToastRegion } from '../../shared/ui/index.js';
import { useAuth } from '../../features/auth/AuthProvider.jsx';
import './layouts.css';

const primaryNavigation = [
  { label: '홈', to: '/app', icon: '⌂' },
  { label: '프로젝트', to: '/projects', icon: '▣' },
];

function WorkspaceNavigation({ onNavigate }) {
  return (
    <nav className="workspace-nav" aria-label="주요 메뉴">
      <p className="workspace-nav__label">내 워크스페이스</p>
      {primaryNavigation.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/app'}
          onClick={onNavigate}
        >
          <span aria-hidden="true">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
      <div className="workspace-nav__divider" />
      <NavLink to="/settings" onClick={onNavigate}>
        <span aria-hidden="true">⚙</span>
        설정
      </NavLink>
    </nav>
  );
}

export default function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = location.pathname.startsWith('/projects/')
    ? '프로젝트'
    : location.pathname === '/projects'
      ? '프로젝트'
      : '내 워크스페이스';

  async function handleLogout() {
    await logout();
    navigate('/auth/login', {
      replace: true,
      state: { authTransition: true, source: 'logout', intent: 'login' },
    });
  }

  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>

      <aside className="workspace-sidebar">
        <NavLink className="workspace-brand" to="/app">
          <span aria-hidden="true">V</span>
          <strong>Venture Verify</strong>
        </NavLink>
        <div className="workspace-switcher">
          <span className="workspace-switcher__dot" aria-hidden="true" />
          내 워크스페이스
        </div>
        <WorkspaceNavigation />
        <NavLink className="workspace-new-project" to="/projects/new">
          <span aria-hidden="true">＋</span>
          새 프로젝트
        </NavLink>
        <div className="workspace-sidebar__bottom">
          <a href="mailto:support@ventureverify.local">도움말</a>
          <button
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            aria-expanded={accountOpen}
          >
            {user?.displayName || '내 계정'}
            <span aria-hidden="true">⌄</span>
          </button>
        </div>
        {accountOpen && (
          <div className="workspace-account-panel">
            <strong>{user?.displayName}</strong>
            <span>{user?.username}</span>
            <Button variant="outline" size="small" onClick={handleLogout}>로그아웃</Button>
          </div>
        )}
      </aside>

      <header className="workspace-desktop-header">
        <span>{title}</span>
        <button
          type="button"
          aria-label="계정 메뉴"
          onClick={() => setAccountOpen((open) => !open)}
          aria-expanded={accountOpen}
        >
          {user?.displayName || '내 계정'} ⌄
        </button>
      </header>

      <header className="workspace-mobile-header">
        <button
          type="button"
          className="app-header__menu"
          aria-label="메뉴 열기"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          ☰
        </button>
        <strong>{title}</strong>
        <button type="button" aria-label="계정 메뉴" onClick={() => setAccountOpen((open) => !open)}>◌</button>
      </header>
      {accountOpen && (
        <div className="workspace-mobile-account">
          <strong>{user?.displayName}</strong>
          <span>{user?.username}</span>
          <Button variant="outline" size="small" onClick={handleLogout}>로그아웃</Button>
        </div>
      )}

      <main id="main-content" className="workspace-main" tabIndex="-1"><Outlet /></main>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="메뉴">
        <WorkspaceNavigation onNavigate={() => setDrawerOpen(false)} />
        <NavLink className="workspace-new-project" to="/projects/new" onClick={() => setDrawerOpen(false)}>
          ＋ 새 프로젝트
        </NavLink>
      </Drawer>
      <ToastRegion />
    </div>
  );
}
