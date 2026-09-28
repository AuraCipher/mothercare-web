/**
 * HeroCanvas Tests
 *
 * The hero canvas is a purely decorative background. When WebGL is
 * unavailable or blocked (context loss), THREE.WebGLRenderer throws from
 * inside the effect — that must degrade to a static fallback, never crash
 * the landing page through the error boundary.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../helpers/test-utils';

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  return {
    ...actual,
    WebGLRenderer: class WebGLRenderer {
      constructor() {
        throw new Error('Error creating WebGL context.');
      }
    },
  };
});

import HeroCanvas from '@/components/hero-canvas';

describe('HeroCanvas', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('falls back to a static aria-hidden background when WebGL context creation fails', () => {
    // THREE.WebGLRenderer is mocked to throw exactly like a real
    // browser without WebGL (or with a blocked context) would.
    render(<HeroCanvas />);

    const fallback = screen.getByTestId('hero-canvas-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveAttribute('aria-hidden', 'true');
    expect(fallback.className).toContain('-z-10');

    // The failure is reported quietly, not thrown to the error boundary.
    expect(warnSpy).toHaveBeenCalledWith(
      'HeroCanvas: WebGL unavailable, using static background.',
      expect.any(Error),
    );
  });

  it('does not render the live canvas container after WebGL failure', () => {
    const { container } = render(<HeroCanvas />);
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.getByTestId('hero-canvas-fallback')).toBeInTheDocument();
  });
});
