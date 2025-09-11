import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminQuizList.css';

const AdminQuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/quizzes')
      .then(res => {
        setQuizzes(res.data);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load quizzes');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function handleDelete(quizId) {
    if (window.confirm(`Are you sure you want to delete Quiz #${quizId}?`)) {
      axios.delete(`/api/quizzes/${quizId}`)
        .then(() => {
          setQuizzes(quizzes.filter(q => q.quizId !== quizId));
        })
        .catch(err => {
          console.error(err);
          alert('Failed to delete quiz.');
        });
    }
  }

  function handleAnalyze(quizId) {
  
    axios.post(`/api/quizzes/analyze/${quizId}`)

      .then(res => {
        alert("✅ Analysis complete!");
        console.log(res.data);
      })
      .catch(err => {
        console.error(err);
        alert("❌ Failed to analyze quiz.");
      });
  
}


  if (loading) return <div className="loading">Loading quizzes...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-quiz-list">
      <h2>All Quizzes</h2>
      <table className="quiz-table">
        <thead>
          <tr>
            <th>Quiz ID</th>
            <th>Title</th>
            <th>Created At</th>
            <th>Questions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {quizzes.map(q => (
            <tr key={q.quizId}>
              <td>{q.quizId}</td>
              <td>{q.title}</td>
              <td>{new Date(q.createdAt).toLocaleString()}</td>
              <td>{q.questions.length}</td>
              <td>
                <button
                  onClick={() => handleAnalyze(q.quizId)}
                  className="analyze-btn"
                >
                  Analyze
                </button>
                <button
                  onClick={() => handleDelete(q.quizId)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminQuizList;

