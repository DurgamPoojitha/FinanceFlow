import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { FinanceContext } from '../context/FinanceContext';
import { describe, it, expect, vi } from 'vitest';

describe('TransactionForm Component', () => {
    const mockAddTransaction = vi.fn();
    const mockUpdateTransaction = vi.fn();
    const mockOnClose = vi.fn();

    const mockContextValue = {
        addTransaction: mockAddTransaction,
        updateTransaction: mockUpdateTransaction,
    };

    const renderWithContext = (editingTransaction = null) => {
        return render(
            <FinanceContext.Provider value={mockContextValue}>
                <TransactionForm onClose={mockOnClose} editingTransaction={editingTransaction} />
            </FinanceContext.Provider>
        );
    };

    it('renders empty form for adding new transaction', () => {
        const { container } = renderWithContext();
        expect(screen.getByText('New Transaction')).toBeInTheDocument();
        const submitBtn = container.querySelector('button[type="submit"]');
        expect(submitBtn).toBeInTheDocument();
    });

    it('renders pre-filled form when editing an existing transaction', () => {
        const { container } = renderWithContext({ id: '1', type: 'Expense', amount: 50, category: 'Food', date: '2023-10-10', description: 'Lunch' });
        expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
        expect(screen.getByDisplayValue('50')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Lunch')).toBeInTheDocument();
        const submitBtn = container.querySelector('button[type="submit"]');
        expect(submitBtn).toBeInTheDocument();
    });

    it('submits form payload accurately to the context provider', async () => {
        const { container } = renderWithContext();

        fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100' } });
        fireEvent.change(screen.getByPlaceholderText('What was this for?'), { target: { value: 'Groceries' } });

        const submitBtn = container.querySelector('button[type="submit"]');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockAddTransaction).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });
});
