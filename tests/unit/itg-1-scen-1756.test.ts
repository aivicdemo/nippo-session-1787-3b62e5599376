import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - ダッシュボード色分け表示', () => {
  // SCEN-1756: [edge] ダッシュボード色分け表示機能 - 優先度最高ランクの閾値超過（スコア 81）のとき最高優先度色で表示される
  test('スコア81のとき、最高優先度色#FF0000で表示される', () => {
    // Arrange: テスト入力データを準備
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 81,
        keyword: 'データベース接続タイムアウト',
        impactLevel: 'high',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 80,
      yellowThresholdMin: 50,
    };

    const requestedBy = 'manager-user-001';

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy,
    };

    // Act: 関数を実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // Assert: 結果を検証
    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(1);

    const colorizedIssue = result.colorizedIssues[0];
    expect(colorizedIssue.issueId).toBe('issue-001');
    expect(colorizedIssue.priorityScore).toBe(81);
    expect(colorizedIssue.highlightColor).toBe('red');

    // 色分布を確認（赤に1件、黄・緑に0件）
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);

    // 処理時刻がISO 8601形式で記録されていることを確認
    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});