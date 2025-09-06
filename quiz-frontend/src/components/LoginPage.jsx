// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

function LoginPage({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:8000/api/auth/login',
        new URLSearchParams({ username, password })
      );
      setUser(res.data);
      navigate('/');
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className={`login-card${isLoading ? ' loading' : ''}`}>
        <h2>Login to Learning Platform</h2>
        <input
          className="login-input"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          disabled={isLoading}
        />
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <button
          className="login-button"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="login-spinner" />
              Logging in…
            </>
          ) : (
            'Login'
          )}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
