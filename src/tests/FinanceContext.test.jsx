/**
 * A quick test just to make sure our global state brain (the FinanceContext)
 * boots up correctly and starts us off as a 'Viewer'. 
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FinanceProvider, useFinance } from '../context/FinanceContext';
import { describe, it, expect } from 'vitest';

// A simple test component that consumes our context to verify it initializes correctly
const TestConsumer = () => {
    const { role } = useFinance();
    return <div data-testid="role-display">{role}</div>;
};

describe('FinanceContext', () => {
    it('initializes with the default role of "Viewer"', () => {
        render(
            <FinanceProvider>
                <TestConsumer />
            </FinanceProvider>
        );

        expect(screen.getByTestId('role-display')).toHaveTextContent('Viewer');
    });
});
