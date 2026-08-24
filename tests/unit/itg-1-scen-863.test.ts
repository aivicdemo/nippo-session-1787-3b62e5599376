import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - ハイライト対象課題が存在しない場合', () => {
  // SCEN-863
  test('ハイライト対象の課題が見つからない場合、エラーメッセージが表示される', () => {
    const emptyIssues: IssueSummary[] = [];
    
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: emptyIssues,
      colorThresholds: colorThresholds,
      requestedBy: 'manager-001',
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      prioritizeAndColorizeIssues(input);
    }).toThrow(/ハイライト対象の課題が見つかりません/);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('ハイライト対象の課題が見つかりません')
    );

    consoleSpy.mockRestore();
  });
});