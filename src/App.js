import React, { useState } from 'react';
import './index.css';
import DashboardPage from './pages/DashboardPage';
import BudgetPlannerPage from './pages/BudgetPlannerPage';

function App() {
  const [page, setPage] = useState('dashboard');

  if (page === 'planner') {
    return <BudgetPlannerPage onNavigate={setPage} />;
  }
  return <DashboardPage onNavigate={setPage} />;
}

export default App;
