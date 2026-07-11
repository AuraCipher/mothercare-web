import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

vi.mock('next/image', () => ({
  default: function MockNextImage(props: Record<string, unknown>) {
    const { priority: _p, fill: _f, ...rest } = props;
    return React.createElement('img', {
      ...rest,
      alt: (rest.alt as string) ?? '',
    });
  },
}));

function mockIcon(name: string) {
  return function MockLucideIcon(props: Record<string, unknown>) {
    return React.createElement('span', { 'data-icon': name, ...props });
  };
}

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Shield: mockIcon('Shield'),
    Building2: mockIcon('Building2'),
    GraduationCap: mockIcon('GraduationCap'),
    Users: mockIcon('Users'),
    ArrowLeft: mockIcon('ArrowLeft'),
    Check: mockIcon('Check'),
    ChevronRight: mockIcon('ChevronRight'),
    Plus: mockIcon('Plus'),
    X: mockIcon('X'),
  };
});
