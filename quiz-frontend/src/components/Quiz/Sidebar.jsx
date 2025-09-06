import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <button onClick={() => navigate('/quiz')}>Start Quiz</button>
    </aside>
  );
};

export default Sidebar;
