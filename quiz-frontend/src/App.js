// src/App.jsx

import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import UserDashboard    from './components/UserDashboard';
import LoginPage        from './components/LoginPage';
import CompletionScreen from './components/CompletionScreen';

import UserRecommendations from './components/UserRecommendations';
import AdminLogin       from './components/AdminLogin';
import AdminDashboard   from './components/AdminDashboard';
import CreateQuiz       from './components/CreateQuiz';
import QuestionForm     from './components/QuestionForm';
import QuizList from './components/AdminQuizList'; 
import Quizzes          from './components/Quizzes';
import QuizWrapper      from './components/QuizWrapper';

function App() {
  const [user, setUser]         = useState(null);
  const [lecturer, setLecturer] = useState(null);

  return (
    <Router>
      <Routes>
        {/*** PUBLIC ROUTES ***/}
        <Route path="/login"       element={<LoginPage setUser={setUser} />} />
        <Route path="/admin-login" element={<AdminLogin setLecturer={setLecturer} />} />

        {/*** ADMIN PROTECTED ***/}
        {lecturer && (
          <Route path="/admin" element={<AdminDashboard lecturer={lecturer} />}>
            {/* Admin Landing */}
            <Route index element={<div></div>} />

            {/* Step 1: Create Quiz metadata */}
            <Route path="create-quiz" element={<CreateQuiz />} />

            {/* Step 2: Add questions one-by-one */}
            <Route path="create-quiz/:quizId" element={<QuestionForm />} />
            <Route path="quizzes" element={<QuizList lecturer={lecturer} />} />
            


          </Route>
        )}

        {/*** STUDENT PROTECTED ***/}
        {user ? (
          <Route path="/" element={<UserDashboard userId={user.user_id} userName={user.name} />}>
            {/* Dashboard Home */}
            <Route index element={<div>Welcome to your learning dashboard!</div>} />

            {/* List Available Quizzes */}
            <Route path="quizzes" element={<Quizzes userId={user.user_id} />} />

            {/* Take a Specific Quiz */}
            <Route path="quizzes/:quizId" element={<QuizWrapper userId={user.user_id} />} />
            <Route path="recommendations" element={<UserRecommendations userId={user.user_id} />} />

            

          </Route>
        ) : (
          // Redirect any unknown URL to student login
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}

        {/*** QUIZ COMPLETION SCREEN (publicly accessible after finish)***/}
        <Route path="/complete" element={<CompletionScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
