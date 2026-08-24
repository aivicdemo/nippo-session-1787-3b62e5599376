import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorThresholdConfig, IssueSummary } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-708: [error] 優先度別課題ハイライト表示機能 - 発生頻度が欠落している課題でエラーになる
  test('should throw error when issue frequency field is missing', () => {
    const incompleteIssue: IssueSummary = {
      issueId: 'issue-001',
      priorityScore: 85,
      keyword: 'データベース接続エラー',
      impactLevel: 'high'
    };

    const colorThresholdConfig: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [incompleteIssue],
      colorThresholds: colorThresholdConfig,
      requestedBy: 'manager-001'
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/発生頻度|frequency/);
  });
});