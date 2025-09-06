import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserRecommendations.css';

const UserRecommendations = ({ userId }) => {
  const [results, setResults]   = useState([]);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!userId) {
      setError('No user ID. Please log in again.');
      return;
    }

    let ignore = false; // prevents state updates after unmount/second effect

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `/api/recommendations/results/${userId}`
        );

        if (ignore) return;

        // Normalize: backend should return an array, but we harden just in case
        const data = res?.data;
        const arr = Array.isArray(data) ? data : (data ? [data] : []);
        setResults(arr);
      } catch (err) {
        if (ignore) return;

        // Ignore axios canceled errors (React Strict Mode double-effect)
        if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') {
          return;
        }

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            setResults([]);   // show empty state, not an error
            setError(null);
          } else {
            setError(
              err.response?.data?.detail ||
              err.message ||
              'Failed to load recommendations. Please try again.'
            );
          }
        } else {
          setError('Failed to load recommendations. Please try again.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();
    return () => { ignore = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="quizzes-page">
        <div className="spinner-container">
          <div className="spinner" />
        </div>
      </div>
    );
  }

if (error) return <p style={{ color: 'red' }}>{error}</p>;

  if (!results || results.length === 0) {
    return <p>No recommendations found.</p>;
  }

  return (
    <div className="quiz-result-container">
      <h2>Your Quiz Recommendations</h2>

     <div className="recommendations-scroll-container">
  {results.map((res) => {
    const quizId = res.quiz_id ?? res.quizId;
    const title = res.quiz_title || `Quiz #${quizId}`;
    const label = res.model_label || '';
    const conf = typeof res.model_confidence === 'number'
      ? `${(res.model_confidence * 100).toFixed(1)}%`
      : null;
    const stress = res.stress_score ?? res.avg_stress_score ?? null;

    return (
      <div key={`${quizId}-${title}`} className="recommendation-card">
        <div className="card-image">
          <img
            src="https://via.placeholder.com/80"
            alt="Quiz"
          />
        </div>
        <div className="card-content">
          <div className="card-header">
            <h3 className="quiz-title">{title}</h3>
            <div className="meta">
              {label && <span className="badge badge-label">{label}</span>}
              {conf && <span className="badge badge-conf">{conf}</span>}
            </div>
          </div>
          <p className="quiz-id">ID: {quizId}</p>
          {stress !== null && (
            <p className="stress-score">Avg Stress Score: <strong>{stress}</strong></p>
          )}
          <ul className="recommendations-list">
            {(Array.isArray(res.recommendations) && res.recommendations.length > 0)
              ? res.recommendations.map((txt, i) => <li key={i}>{txt}</li>)
              : (res.recommendation ? <li>{res.recommendation}</li> : <li>No text available</li>)
            }
          </ul>
        </div>
      </div>
    );
  })}
</div>

    </div>
  );
};

export default UserRecommendations;
