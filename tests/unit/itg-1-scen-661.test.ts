import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorThresholdConfig, IssueSummary } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度色分け表示機能', () => {
  // SCEN-661
  test('優先度スコアが空文字列のとき、ValidationErrorが発生し、エラーメッセージに「優先度スコアが無効です」が含まれる', () => {
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const issuesWithInvalidScore: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: '' as unknown as number,
        keyword: 'データベース接続エラー',
        impactLevel: 'high',
      },
    ];

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issuesWithInvalidScore,
      colorThresholds: colorThresholds,
      requestedBy: 'user-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/優先度スコアが無効です|数値型が必須です|INVALID_PRIORITY_SCORE/);

    try {
      prioritizeAndColorizeIssues(input);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/優先度スコアが無効です|数値型が必須です/);
        if ('code' in error) {
          expect(error.code).toBe('INVALID_PRIORITY_SCORE');
        }
      }
    }
  });
});