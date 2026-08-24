import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-709
  test('影響度スコアが欠落している課題でエラーになる', () => {
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 75,
        keyword: 'データベース接続エラー',
        impactLevel: 'high'
      }
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40
    };

    const requestedBy = 'user-123';

    expect(() => {
      prioritizeAndColorizeIssues(issues, colorThresholds, requestedBy);
    }).toThrow(/影響度スコアが欠落しています/);

    try {
      prioritizeAndColorizeIssues(issues, colorThresholds, requestedBy);
    } catch (error) {
      expect((error as Error).name).toBe('ValidationError');
      expect((error as Error).message).toMatch(/影響度スコアが欠落しています/);
    }
  });
});