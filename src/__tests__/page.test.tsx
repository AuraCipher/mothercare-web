import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the HeroCanvasWrapper (Three.js can't run in jsdom)
vi.mock('@/components/hero-canvas-wrapper', () => ({
  default: () => <div data-testid="mock-canvas" aria-hidden="true" />,
}));

import Home from '@/app/page';

describe('Home page', () => {
  it('renders the app name heading', () => {
    render(<Home />);
    expect(screen.getByText('Mother Care School')).toBeInTheDocument();
  });

  it('renders the Sign In link', () => {
    render(<Home />);
    const links = screen.getAllByRole('link', { name: /sign in/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute('href', '/login');
  });

  it('renders all three feature sections', () => {
    render(<Home />);
    expect(screen.getByText('Private Communication')).toBeInTheDocument();
    expect(screen.getByText('Smart Broadcasting')).toBeInTheDocument();
    expect(screen.getByText('Batch Management')).toBeInTheDocument();
  });

  it('renders the footer with current year', () => {
    render(<Home />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('renders all section headings', () => {
    render(<Home />);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Why Mother Care')).toBeInTheDocument();
    expect(screen.getByText('Ready to get started?')).toBeInTheDocument();
  });
});
