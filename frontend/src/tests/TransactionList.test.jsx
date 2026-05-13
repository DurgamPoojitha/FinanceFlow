/**
 * This tests the big list of transactions. We make sure it shows the empty state 
 * when there's no data, and we double-check that 'Viewers' can't see the edit buttons!
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionList } from '../components/transactions/TransactionList';
import { FinanceContext } from '../context/FinanceContext';
import { describe, it, expect, vi } from 'vitest';

describe('TransactionList Component', () => {
    const mockDeleteTransaction = vi.fn();
    const mockOnEdit = vi.fn();

    const mockTransactions = [
        { id: '1', type: 'Income', amount: 2000, category: 'Salary', date: '2023-10-01', description: 'October Salary' },
        { id: '2', type: 'Expense', amount: 150, category: 'Utilities', date: '2023-10-05', description: 'Electric Bill' }
    ];

    const renderWithContext = (role = 'Admin', transactions = mockTransactions) => {
        return render(
            <FinanceContext.Provider value={{ role, deleteTransaction: mockDeleteTransaction }}>
                <TransactionList transactions={transactions} onEdit={mockOnEdit} />
            </FinanceContext.Provider>
        );
    };

    it('displays the empty state when receiving an empty transaction array', () => {
        renderWithContext('Viewer', []);
        expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    it('renders the formatted transactions correctly on the ledger', () => {
        renderWithContext();
        // Check formatted prices (+/-)
        expect(screen.getByText('+$2,000.00')).toBeInTheDocument();
        expect(screen.getByText('-$150.00')).toBeInTheDocument();
        // Check labels
        expect(screen.getByText('October Salary')).toBeInTheDocument();
        expect(screen.getByText('Electric Bill')).toBeInTheDocument();
    });

    it('conditionally hides edit/delete buttons for Viewers', () => {
        const { container } = renderWithContext('Viewer');
        expect(container.querySelector('[title="Edit"]')).not.toBeInTheDocument();
        expect(container.querySelector('[title="Delete"]')).not.toBeInTheDocument();
    });

    it('triggers edit callbacks accurately for Admins', () => {
        const { container } = renderWithContext('Admin');
        const editButtons = container.querySelectorAll('[title="Edit"]');
        expect(editButtons.length).toBe(2);

        fireEvent.click(editButtons[0]);
        expect(mockOnEdit).toHaveBeenCalledWith(mockTransactions[0]);
    });
});
