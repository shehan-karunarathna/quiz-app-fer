// src/components/AdminDashboard.jsx

import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { FiMenu, FiHome, FiFileText, FiList } from 'react-icons/fi';
import './AdminDashboard.css';

const AdminDashboard = ({ lecturer }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: '/admin',                 label: 'Dashboard',   icon: <FiHome />     },
    { to: '/admin/create-quiz',     label: 'Create Quiz', icon: <FiFileText /> },
    { to: '/admin/quizzes',         label: 'Quiz Lists',  icon: <FiList />     },
  ];

  return (
    <div className="dashboard-root">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-left">
          <button
            className="header-toggle"
            onClick={() => setCollapsed(!collapsed)}
          >
            <FiMenu size={20} />
          </button>
          <h1 className="header-title">Admin Panel</h1>
        </div>
        <div className="header-right">
          <span className="user-name">Welcome, {lecturer?.name}</span>
          <button
            className="logout-btn"
            onClick={() => navigate('/admin-login')}
          >
            Logout
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="dashboard-body">
        {/* SIDEBAR */}
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
          <nav>
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                // only exact-match for the dashboard root
                end={to === '/admin'}
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                {icon}
                {!collapsed && <span className="link-text">{label}</span>}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          {/* nested admin routes render here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
