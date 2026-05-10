import React, { useState } from 'react';
import './index.css';
import DashboardPage from './pages/DashboardPage';
import BudgetPlannerPage from './pages/BudgetPlannerPage';
import ExpenseFormPage from './pages/ExpenseFormPage';

function App() {
  const [page, setPage] = useState('dashboard');

  if (page === 'planner')  return <BudgetPlannerPage onNavigate={setPage} />;
  if (page === 'expenses') return <ExpenseFormPage   onNavigate={setPage} />;
  return <DashboardPage onNavigate={setPage} />;
}

export default App;
