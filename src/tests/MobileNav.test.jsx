import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNav } from '../components/layout/MobileNav';
import { describe, it, expect, vi } from 'vitest';

describe('MobileNav Component', () => {
    it('renders the Dashboard and Transactions navigation buttons', () => {
        const mockSetActiveTab = vi.fn();
        render(<MobileNav activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    it('calls setActiveTab securely when a navigation button is clicked', () => {
        const mockSetActiveTab = vi.fn();
        render(<MobileNav activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

        // Find the transactions button
        const transactionsBtn = screen.getByText('Transactions').closest('button');
        fireEvent.click(transactionsBtn);

        // Ensure our setter was told to switch over to the transactions tab
        expect(mockSetActiveTab).toHaveBeenCalledWith('transactions');
    });
});
