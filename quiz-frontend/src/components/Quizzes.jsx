import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Quizzes.css';

const Quizzes = ({ userId }) => {
  const [quizzes, setQuizzes]     = useState([]);
  const [isLoading, setLoading]   = useState(true);
  const [error, setError]         = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axios
      .get('/api/quizzes')
      .then(res => {
        setQuizzes(res.data);
        setError(null);
      })
      .catch(err => {
        console.error('Fetch quizzes failed', err);
        setError('Couldn’t load quizzes. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="quizzes-page">
        <div className="spinner-container">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quizzes-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="quizzes-page">
      <h2>Available Quizzes</h2>
      <div className="quiz-card-grid">
        {quizzes.map(q => (
          <div
            key={q.quizId}
            className="quiz-card"
            onClick={() => navigate(`/quizzes/${q.quizId}`)}
          >
            <div className="quiz-id">Quiz #{q.quizId}</div>
            <div className="quiz-title">{q.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Quizzes;

