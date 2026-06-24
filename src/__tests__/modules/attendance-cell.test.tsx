/**
 * Attendance Cell Status Rendering Tests
 */

import { describe, it, expect } from 'vitest';

// Replicate the cellClass and status label logic from the attendance page
function cellClass(status: string): string {
  return status === 'present' ? 'text-green-400 bg-green-900/10' :
    status === 'absent' ? 'text-red-400 bg-red-900/10' :
    status === 'late' ? 'text-yellow-400 bg-yellow-900/10' :
    status === 'leave' ? 'text-blue-400 bg-blue-900/10' :
    status === 'holiday' ? 'text-purple-400 bg-purple-900/10' :
    status === 'function' ? 'text-pink-400 bg-pink-900/10' :
    'text-warm-muted/30';
}

function statusLabel(status: string): string {
  return status === 'present' ? 'P' :
    status === 'absent' ? 'A' :
    status === 'late' ? 'L' :
    status === 'leave' ? 'Lv' :
    status === 'holiday' ? 'H' :
    status === 'function' ? 'F' : '·';
}

describe('cellClass function', () => {
  it('present returns green class', () => {
    expect(cellClass('present')).toContain('text-green-400');
    expect(cellClass('present')).toContain('bg-green-900/10');
  });

  it('absent returns red class', () => {
    expect(cellClass('absent')).toContain('text-red-400');
    expect(cellClass('absent')).toContain('bg-red-900/10');
  });

  it('late returns yellow class', () => {
    expect(cellClass('late')).toContain('text-yellow-400');
    expect(cellClass('late')).toContain('bg-yellow-900/10');
  });

  it('leave returns blue class', () => {
    expect(cellClass('leave')).toContain('text-blue-400');
    expect(cellClass('leave')).toContain('bg-blue-900/10');
  });

  it('holiday returns purple class', () => {
    expect(cellClass('holiday')).toContain('text-purple-400');
    expect(cellClass('holiday')).toContain('bg-purple-900/10');
  });

  it('function returns pink class', () => {
    expect(cellClass('function')).toContain('text-pink-400');
    expect(cellClass('function')).toContain('bg-pink-900/10');
  });

  it('unmarked returns dimmed class', () => {
    expect(cellClass('unmarked')).toContain('text-warm-muted/30');
  });
});

describe('statusLabel function', () => {
  it('present shows P', () => expect(statusLabel('present')).toBe('P'));
  it('absent shows A', () => expect(statusLabel('absent')).toBe('A'));
  it('late shows L', () => expect(statusLabel('late')).toBe('L'));
  it('leave shows Lv', () => expect(statusLabel('leave')).toBe('Lv'));
  it('holiday shows H', () => expect(statusLabel('holiday')).toBe('H'));
  it('function shows F', () => expect(statusLabel('function')).toBe('F'));
  it('unmarked shows ·', () => expect(statusLabel('unmarked')).toBe('·'));
});
