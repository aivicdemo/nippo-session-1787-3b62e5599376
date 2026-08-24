import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示', () => {
  // SCEN-658: [normal] 課題優先度色分け表示機能 - 同じ入力で2回実行しても同じ色分け結果が返される
  test('should return identical colorization results on consecutive executions with the same input', () => {
    // Arrange: テスト入力を準備
    const testIssues: IssueSummary[] = [
      {
        issueId: 'issue-db-001',
        priorityScore: 85,
        keyword: 'データベース接続エラー',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-api-002',
        priorityScore: 55,
        keyword: 'API レスポンス遅延',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-log-003',
        priorityScore: 30,
        keyword: 'ログファイル容量警告',
        impactLevel: 'low',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const requestedBy = 'user-manager-001';

    const input1: PrioritizeAndColorizeIssuesInput = {
      issues: testIssues,
      colorThresholds,
      requestedBy,
    };

    // Act: 1回目の実行
    const result1: ColorizedIssueList = prioritizeAndColorizeIssues(input1);

    // Assert: 1回目の結果を記録
    expect(result1).toBeDefined();
    expect(result1.colorizedIssues).toHaveLength(3);
    expect(result1.colorDistribution).toBeDefined();

    const firstExecutionHighPriorityColor = result1.colorizedIssues[0].highlightColor;
    const firstExecutionMediumPriorityColor = result1.colorizedIssues[1].highlightColor;
    const firstExecutionLowPriorityColor = result1.colorizedIssues[2].highlightColor;

    const firstExecutionDistribution = result1.colorDistribution;
    const firstExecutionTimestamp = result1.processedAt;

    // Act: 2回目の実行（同じ入力）
    const input2: PrioritizeAndColorizeIssuesInput = {
      issues: testIssues,
      colorThresholds,
      requestedBy,
    };

    const result2: ColorizedIssueList = prioritizeAndColorizeIssues(input2);

    // Assert: 2回目の結果を記録
    expect(result2).toBeDefined();
    expect(result2.colorizedIssues).toHaveLength(3);

    const secondExecutionHighPriorityColor = result2.colorizedIssues[0].highlightColor;
    const secondExecutionMediumPriorityColor = result2.colorizedIssues[1].highlightColor;
    const secondExecutionLowPriorityColor = result2.colorizedIssues[2].highlightColor;

    const secondExecutionDistribution = result2.colorDistribution;

    // Assert: 1回目と2回目の色分け結果を比較
    expect(firstExecutionHighPriorityColor).toBe(secondExecutionHighPriorityColor);
    expect(firstExecutionMediumPriorityColor).toBe(secondExecutionMediumPriorityColor);
    expect(firstExecutionLowPriorityColor).toBe(secondExecutionLowPriorityColor);

    // Assert: 優先度レベルが一致することを確認
    expect(result1.colorizedIssues[0].shouldHighlight).toBe(
      result2.colorizedIssues[0].shouldHighlight
    );
    expect(result1.colorizedIssues[1].shouldHighlight).toBe(
      result2.colorizedIssues[1].shouldHighlight
    );
    expect(result1.colorizedIssues[2].shouldHighlight).toBe(
      result2.colorizedIssues[2].shouldHighlight
    );

    // Assert: 色分布が一致することを確認
    expect(firstExecutionDistribution.red).toBe(secondExecutionDistribution.red);
    expect(firstExecutionDistribution.yellow).toBe(secondExecutionDistribution.yellow);
    expect(firstExecutionDistribution.green).toBe(secondExecutionDistribution.green);

    // Assert: 具体的な色コード検証
    // priorityScore 85 -> redThresholdMin 70以上 -> 赤色
    expect(firstExecutionHighPriorityColor).toBe('red');
    // priorityScore 55 -> yellowThresholdMin 40以上70未満 -> 黄色
    expect(firstExecutionMediumPriorityColor).toBe('yellow');
    // priorityScore 30 -> 40未満 -> 緑色
    expect(firstExecutionLowPriorityColor).toBe('green');

    // Assert: 色分布の具体的な値
    expect(result1.colorDistribution.red).toBe(1);
    expect(result1.colorDistribution.yellow).toBe(1);
    expect(result1.colorDistribution.green).toBe(1);

    expect(result2.colorDistribution.red).toBe(1);
    expect(result2.colorDistribution.yellow).toBe(1);
    expect(result2.colorDistribution.green).toBe(1);

    // Assert: processedAt は異なる可能性があるため、形式だけ確認
    expect(typeof result1.processedAt).toBe('string');
    expect(typeof result2.processedAt).toBe('string');
  });
});