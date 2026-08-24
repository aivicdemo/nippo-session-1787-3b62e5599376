import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('ダッシュボード強調表示機能 - 色分け処理', () => {
  // SCEN-1063
  test('課題データが null のとき、強調表示の色分けがエラーになる', () => {
    const colorThresholdConfig: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const inputWithNullIssue: PrioritizeAndColorizeIssuesInput = {
      issues: [null as unknown as IssueSummary],
      colorThresholds: colorThresholdConfig,
      requestedBy: 'manager_001',
    };

    expect(() =>
      prioritizeAndColorizeIssues(inputWithNullIssue)
    ).toThrow(/score|null|課題データ/i);
  });
});