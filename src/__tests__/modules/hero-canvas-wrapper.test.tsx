import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/dynamic to render the lazily-loaded component inside Suspense
vi.mock('next/dynamic', () => {
  const ReactMock = require('react');
  return {
    default:
      (loader: () => Promise<{ default: React.ComponentType<any> }>) => {
        const LazyComponent = ReactMock.lazy(loader);
        return (props: Record<string, unknown>) =>
          ReactMock.createElement(
            ReactMock.Suspense,
            { fallback: null },
            ReactMock.createElement(LazyComponent, props),
          );
      },
  };
});

// Mock the HeroCanvas component
vi.mock('@/components/hero-canvas', () => ({
  default: () => <div data-testid="mock-canvas" aria-hidden="true" />,
}));

import HeroCanvasWrapper from '@/components/hero-canvas-wrapper';

describe('HeroCanvasWrapper', () => {
  it('renders the mock canvas element with aria-hidden', async () => {
    render(<HeroCanvasWrapper />);
    const canvas = await screen.findByTestId('mock-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });
});
