import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorThresholdConfig, type IssueSummary } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-1333
  test('should throw error when colorThresholds is null', () => {
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'デーベース接続エラー',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 55,
        keyword: 'ログイン画面の表示遅延',
        impactLevel: 'medium',
      },
    ];

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds: null as any,
      requestedBy: 'user-manager-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/ダッシュボード設定/);
  });
});