// src/pages/AdminLogin.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = ({ setLecturer }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const res = await axios.post(
        '/api/admin/login',
        formData,
        { withCredentials: true }
      );
      setLecturer(res.data);
      navigate('/admin');
    } catch (err) {
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-card">
        <h2>Admin Login to University LMS</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="login-input"
          disabled={isLoading}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="login-input"
          disabled={isLoading}
          required
        />
        <button
          type="submit"
          className="login-button"
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
      </form>
    </div>
  );
};

export default AdminLogin;

