import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
//import './CompletionScreen.css';


const CompletionScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get quiz data and answers from location state
  const { questions = [], userAnswers = [] } = location.state || {};

  const renderQuestionResult = (question, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = userAnswer === question.correctAnswer;
    
    return (
      <div key={index} className={`question-result ${isCorrect ? 'correct' : 'incorrect'}`}>
        <h3>Question {index + 1}: {question.text}</h3>
        
        <div className="options-container">
          {question.options.map((option, optionIndex) => {
            let optionClass = '';
            if (option === question.correctAnswer) {
              optionClass = 'correct-answer';
            } else if (option === userAnswer && !isCorrect) {
              optionClass = 'incorrect-selection';
            } else if (option === userAnswer) {
              optionClass = 'user-selection';
            }
            
            return (
              <div 
                key={optionIndex} 
                className={`option ${optionClass}`}
              >
                {option}
                {option === question.correctAnswer && (
                  <span className="correct-marker"> ✓</span>
                )}
                {option === userAnswer && !isCorrect && (
                  <span className="incorrect-marker"> ✗</span>
                )}
              </div>
            );
          })}
        </div>
        
        {!isCorrect && (
          <p className="correct-answer-text">
            Correct answer: {question.correctAnswer}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="completion-screen">
      <h2>🎉 Quiz Completed! 🎉</h2>
      
      <div className="results-summary">
        <p>
          You scored {userAnswers.filter((answer, i) => answer === questions[i]?.correctAnswer).length} 
          out of {questions.length}
        </p>
      </div>
      
      <div className="questions-review">
        <h3>Your Answers:</h3>
        {questions.map((question, index) => renderQuestionResult(question, index))}
      </div>
      
      <button 
        className="home-btn"
        onClick={() => navigate('/')}
      >
        Back to Home
      </button>
    </div>
  );
};

export default CompletionScreen;