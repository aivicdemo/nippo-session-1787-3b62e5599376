import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { IssueSummary, ColorThresholdConfig, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Prioritization and Colorization', () => {
  // SCEN-659: [error] 課題優先度色分け表示機能 - 優先度スコアが null のとき色分けルールが適用されずエラーになる
  test('should throw error when priority score is null during color rule evaluation', () => {
    const invalidIssue: IssueSummary = {
      issueId: 'issue-001',
      priorityScore: null as any,
      keyword: 'database-performance',
      impactLevel: 'high',
    };

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const requestedBy = 'user-dept-manager';

    expect(() =>
      prioritizeAndColorizeIssues([invalidIssue], colorThresholds, requestedBy)
    ).toThrow(/priority|null|score|color/i);
  });
});