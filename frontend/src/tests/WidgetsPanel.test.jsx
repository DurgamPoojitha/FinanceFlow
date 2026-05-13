/**
 * Testing the right-side widgets. We clear out local storage first so we always
 * start entirely fresh, and then we pretend to add a new credit card!
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WidgetsPanel } from '../components/dashboard/WidgetsPanel';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('WidgetsPanel Component', () => {
    beforeEach(() => {
        // Clear local storage strings to ensure clean tests
        localStorage.clear();
    });

    it('loads default goals on fresh initialization', () => {
        render(<WidgetsPanel />);
        expect(screen.getByText('New iMac')).toBeInTheDocument();
        expect(screen.getByText('My Goals')).toBeInTheDocument();
        expect(screen.getByText('My Card')).toBeInTheDocument();
    });

    it('can open the Add Card modal and register new inputs', () => {
        render(<WidgetsPanel />);

        // Open modal
        fireEvent.click(screen.getByText('Add Card'));
        expect(screen.getByText('Add New Card')).toBeInTheDocument();

        // Simulate typing a card number
        const numberInput = screen.getByPlaceholderText('1234567812345678');
        fireEvent.change(numberInput, { target: { value: '4242424242424242' } });
        expect(numberInput.value).toBe('4242424242424242');

        // Modal close acts cleanly
        fireEvent.click(screen.getByRole('button', { name: 'Save Card' }));
    });
});
