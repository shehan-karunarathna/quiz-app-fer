import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './CreateQuiz.css'; // reuse form styles

export default function QuestionForm() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz]   = useState(null);
  const [idx, setIdx]     = useState(1);
  const [form, setForm]   = useState({
    text: '', A: '', B: '', C: '', D: '', correct: 'A', topic: ''
  });
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:8000/api/quizzes/${quizId}`)
      .then(r => setQuiz(r.data))
      .catch(() => alert('Quiz not found') && navigate('/admin'));
  }, [quizId, navigate]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(
        `http://localhost:8000/api/quizzes/${quizId}/questions`,
        {
          text: form.text,
          options: { A: form.A, B: form.B, C: form.C, D: form.D },
          correct: form.correct,
          topic: form.topic
        }
      );
      if (idx < Number(quiz.question_count)) {

        setIdx(idx + 1);
        setForm({ text:'', A:'',B:'',C:'',D:'', correct:'A', topic:'' });
      } else {
        alert('All questions added!');
        navigate('/admin');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save question');
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz) {
  return (
    <div className="create-quiz-container">
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    </div>
  );
}


  return (
    <div className="create-quiz-container">
      <form 
        className={`create-quiz-card${isSubmitting ? ' loading' : ''}`}
        onSubmit={handleSubmit}
      >
        <h2>
          {quiz.title} — Question {idx} of {quiz.question_count}
        </h2>

        <label>Question Text</label>
        <textarea
          name="text"
          value={form.text}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />

        <div className="options-row">
          {['A','B','C','D'].map(opt => (
            <div key={opt} className="opt-group">
              <label>Option {opt}</label>
              <input
                name={opt}
                value={form[opt]}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
          ))}
        </div>

        <label>Correct Answer</label>
        <select
          name="correct"
          value={form.correct}
          onChange={handleChange}
          disabled={isSubmitting}
        >
          {['A','B','C','D'].map(o => <option key={o}>{o}</option>)}
        </select>

        <label>Topic</label>
        <input
          name="topic"
          value={form.topic}
          onChange={handleChange}
          disabled={isSubmitting}
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Question'}
        </button>
      </form>
    </div>
  );
}
