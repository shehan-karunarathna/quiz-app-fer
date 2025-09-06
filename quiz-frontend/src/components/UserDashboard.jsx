import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import './UserDashboard.css'; 
const UserDashboard = ({ userId, userName }) => {
  const handleLogout = () => {
    navigate('/login');
  };
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="dashboard-navbar">
        <div className="navbar-brand">Learning Platform</div>
        <div className="user-info">
          <span className="user-name">{userName}</span>
          <span className="user-id">ID: {userId}</span>
        </div>
      </nav>
      
      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <ul className="sidebar-menu">
            <li className="menu-item" onClick={() => navigate('/')}>Dashboard</li>
            <li 
              className="menu-item start-quiz-btn" 
              onClick={() => navigate('/quizzes')}
            >
               Quizzes
            </li>
            <li className="menu-item">My Progress</li>
            <li className="menu-item">Settings</li>
            <li className="menu-item" onClick={() => navigate('/recommendations')}>
  Show Recommendations
</li>


            <li
              className="menu-item logout-item"
              onClick={handleLogout}
            >
              Logout
            </li>
          </ul>
        </aside>
        
        
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;