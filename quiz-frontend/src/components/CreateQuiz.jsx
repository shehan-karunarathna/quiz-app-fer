import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateQuiz.css';

export default function CreateQuiz() {
  const [title, setTitle] = useState('');
  const [count, setCount] = useState(1);
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = // after
await axios.post('/api/quizzes/', { title, question_count: count });

      const { quizId } = res.data;
      alert(`Quiz #${quizId} created! Now add your ${count} questions.`);
      navigate(`/admin/create-quiz/${quizId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-quiz-container">
      <form 
        className={`create-quiz-card${isLoading ? ' loading' : ''}`}
        onSubmit={handleSubmit}
      >
        <h2>New Quiz</h2>

        <label>Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          disabled={isLoading}
        />

        <label>Number of Questions</label>
        <input
          type="number"
          min="1"
          value={count}
          onChange={e => setCount(+e.target.value)}
          required
          disabled={isLoading}
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating…' : 'Create Quiz'}
        </button>
      </form>
    </div>
  );
}

