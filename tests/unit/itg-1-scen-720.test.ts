import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorThresholdConfig, type IssueSummary } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-720: [error] 優先度別課題ハイライト表示機能 - 発生頻度が 0 未満のとき処理がエラーになる
  test('発生頻度が負の値（-1）の場合、エラーをthrowする', () => {
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'テスト自動化ツール導入遅延',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 50,
        keyword: 'ドキュメント更新漏れ',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-003',
        priorityScore: 75,
        keyword: 'CI/CDパイプライン構築停滞',
        impactLevel: 'high',
      },
    ];

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'user-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/発生頻度/);
  });
});