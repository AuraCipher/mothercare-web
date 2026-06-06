/**
 * Test Utilities
 *
 * Provides a custom render function that wraps components with
 * any necessary providers (Router, Context, etc.).
 *
 * Usage:
 *   import { render, screen } from '../helpers/test-utils';
 *   render(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Add any providers here as the app grows (Router, Auth Context, etc.)
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Custom render that wraps with AllProviders.
 * Extends RTL's render options to include a wrapper.
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
