import React from 'react';

const QuestionCard = ({ question, options, selectedAnswer, onSelect }) => {
  return (
    <div className="question-card">
      <h3>{question}</h3>
      <div className="options-grid">
        {Object.entries(options).map(([key, value]) => (
          <button
            key={key}
            className={`option-btn ${selectedAnswer === key ? 'selected' : ''}`}
            onClick={() => onSelect(key)}
          >
            <span className="option-letter">{key}</span>
            <span className="option-text">{value}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;