import React from 'react';
import { render, screen } from '@testing-library/react';
import { FinanceContext } from '../context/FinanceContext';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { describe, it, expect } from 'vitest';

describe('SummaryCards Component', () => {
    // Mock provider setup so we can test the cards independently from the full app wrapping
    const mockContextValue = {
        totalBalance: 5000.5,
        totalIncome: 7000,
        totalExpense: 1999.5
    };

    const renderWithContext = () => {
        return render(
            <FinanceContext.Provider value={mockContextValue}>
                <SummaryCards />
            </FinanceContext.Provider>
        );
    };

    it('renders all three key metric cards: Balance, Income, Expense', () => {
        renderWithContext();

        expect(screen.getByText('Available Balance')).toBeInTheDocument();
        expect(screen.getByText('Total Income')).toBeInTheDocument();
        expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    });

    it('displays the correctly formatted monetary values from context', () => {
        renderWithContext();

        // $5,000.50 formatted
        expect(screen.getByText('$5,000.50')).toBeInTheDocument();
        // $7,000.00 formatted
        expect(screen.getByText('$7,000.00')).toBeInTheDocument();
        // $1,999.50 formatted
        expect(screen.getByText('$1,999.50')).toBeInTheDocument();
    });
});
