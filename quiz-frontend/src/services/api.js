import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api/';

export const submitQuizResponse = async (data) => {
  const formData = new FormData();
  formData.append('user_id', data.userId);
  formData.append('question_id', data.questionId);
  formData.append('selected_answer', data.selectedAnswer);
  formData.append('is_correct', data.isCorrect);
  formData.append('topic', data.topic);
  formData.append('image', data.image); 
  try {
    const response = await axios.post(`/api/quiz/submit-answer`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to submit answer: ' + error.message);
  }
};

export const getRecommendations = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE}/api/recommendations/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to get recommendations: ' + error.message);
  }
};