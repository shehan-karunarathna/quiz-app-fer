import React, { useState, useRef, useEffect } from 'react';
import WebcamCapture from './WebcamCapture';
import QuestionCard from './QuestionCard';
import ProgressBar from './ProgressBar';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Quiz = ({ questions,userId ,quizId  }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const webcamRef = useRef(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const navigate = useNavigate();
  

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestion]);

  const captureEmotionSamples = async () => {
    if (!webcamRef.current || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    const formData = new FormData();
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000); // in seconds

    try {
      // Capture 3 frames
      for (let i = 0; i < 3; i++) {
        try {
          const imageSrc = webcamRef.current.getScreenshot();
          if (!imageSrc) throw new Error('Webcam capture failed');

          const response = await fetch(imageSrc);
          if (!response.ok) throw new Error('Failed to fetch image');
          const blob = await response.blob();
          if (!blob || blob.size === 0) throw new Error('Empty image blob');

          formData.append('images', blob, `frame_${i}.jpg`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (captureErr) {
          console.warn(`Capture error (frame ${i}):`, captureErr.message);
        }
      }

      // Add answer details
      const question = questions[currentQuestion];
      formData.append('quiz_id', quizId);
      formData.append('user_id', userId);
      formData.append('question_id', question.id);
      formData.append('selected_answer', selectedAnswer);
      formData.append('topic', question.topic);
      formData.append('is_correct', selectedAnswer === question.correct_answer);
      formData.append('time_taken', timeTaken);

      const res = await axios.post(
        'http://localhost:8000/api/quiz/submit-answer',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
          timeout: 10000,
        }
      );

      console.log('Submitted:', res.data);

      // Go to next or finish
      setSelectedAnswer('');
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        navigate('/complete', { state: { userId } });
      }

    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.detail || err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="quiz-container">
      <ProgressBar current={currentQuestion + 1} total={questions.length} />
      <WebcamCapture ref={webcamRef} />
      <QuestionCard
        question={questions[currentQuestion].text}
        options={questions[currentQuestion].options}
        selectedAnswer={selectedAnswer}
        onSelect={setSelectedAnswer}
      />
      {error && <div className="error-message">{error}</div>}
      <button
        className="submit-btn"
        onClick={captureEmotionSamples}
        disabled={!selectedAnswer || isSubmitting}
      >
        {isSubmitting
          ? 'Submitting...'
          : currentQuestion === questions.length - 1
          ? 'Finish Quiz'
          : 'Next Question'}
      </button>
    </div>
  );
};

export default Quiz;
