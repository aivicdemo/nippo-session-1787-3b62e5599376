import { describe, it, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Dashboard Colorization', () => {
  it('SCEN-2991: should throw ValidationError when issues array is empty', () => {
    // Arrange
    const emptyInput: PrioritizeAndColorizeIssuesInput = {
      issues: [],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      } as ColorThresholdConfig,
      requestedBy: 'user-123',
    };

    // Act & Assert
    expect(() => prioritizeAndColorizeIssues(emptyInput)).toThrow(/課題リストが空です|配列の長さが0です/);
  });
});