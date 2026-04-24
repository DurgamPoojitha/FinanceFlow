import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Layout } from './components/layout/Layout';

import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';

/**
 * Just a simple wrapper for our dashboard page to keep the file structure clean.
 */
function Dashboard() {
  return <DashboardPage />;
}

/**
 * Same here, just wrapping the transactions view.
 */
function Transactions() {
  return <TransactionsPage />;
}

/**
 * Our main layout handler. Since we only have two main views, we decided
 * to just use a simple state toggle (`activeTab`) instead of pulling in
 * a heavy router library like React Router. Keeps the app lightweight and fast!
 */
function Main() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'transactions' && <Transactions />}
    </Layout>
  );
}

/**
 * The root component!
 * We wrap everything inside the `FinanceProvider` right at the top level.
 * This is super helpful because it means any child component down the tree 
 * can easily grab transaction data or the current theme without us having to 
 * pass props down manually through ten layers of components.
 */
function App() {
  return (
    <FinanceProvider>
      <Main />
    </FinanceProvider>
  );
}

export default App;
