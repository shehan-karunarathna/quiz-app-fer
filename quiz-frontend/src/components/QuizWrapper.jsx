// src/pages/QuizWrapper.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
// Adjust this path to wherever your Quiz.jsx actually lives:
import Quiz from '../components/Quiz/Quiz';

const QuizWrapper = ({ userId }) => {
  const { quizId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      // use the plural “quizzes” if that’s what your backend exposes
      .get(`http://localhost:8000/api/quizzes/${quizId}`)
      .then(res => {
        const quizData = res.data;
        if (!Array.isArray(quizData.questions)) {
          throw new Error('Unexpected payload');
        }
        // normalize to what Quiz.jsx expects
        const normalized = quizData.questions.map(q => ({
          id: q.questionId,
          text: q.text,
          options: q.options,
          correct_answer: q.correct,
          topic: q.topic,
        }));
        setQuestions(normalized);
      })
      .catch(err => {
        console.error('Fetch quiz failed', err);
        setError('Couldn’t load that quiz. Redirecting back to list…');
        setTimeout(() => navigate('/quizzes'), 3000);
      });
  }, [quizId, navigate]);

  if (error) return <p>{error}</p>;
  if (questions.length === 0) return <p>Loading quiz…</p>;
  // inside QuizWrapper.jsx’s render:
return <Quiz questions={questions} userId={userId} quizId={quizId} />;

};

export default QuizWrapper;
