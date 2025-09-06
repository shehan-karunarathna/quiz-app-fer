import React from 'react';
import './Header.css';

const Header = ({ userId, username }) => {
  return (
    <header className="header">
      <div className="header-left">Emotion Quiz</div>
      <div className="header-right">
        <span>User ID: {userId}</span>
        <span className="username">Name: {username}</span>
      </div>
    </header>
  );
};

export default Header;
