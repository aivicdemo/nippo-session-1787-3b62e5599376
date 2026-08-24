import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-707: [error] 優先度別課題ハイライト表示機能 - 優先度スコアが未設定（undefined）の課題でエラーになる
  test('should throw error when priorityScore is undefined', () => {
    const issueWithUndefinedScore = {
      issueId: 'issue-001',
      priorityScore: undefined as unknown as number,
      keyword: 'サーバーダウン',
      impactLevel: 'high' as const,
    };

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [issueWithUndefinedScore],
      colorThresholds,
      requestedBy: 'user-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/priorityScore/);
  });
});