import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Layout } from './components/layout/Layout';

import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';

function Dashboard() {
  return <DashboardPage />;
}

function Transactions() {
  return <TransactionsPage />;
}

function Main() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'transactions' && <Transactions />}
    </Layout>
  );
}

function App() {
  return (
    <FinanceProvider>
      <Main />
    </FinanceProvider>
  );
}

export default App;
