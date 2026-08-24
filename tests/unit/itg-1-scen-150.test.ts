import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Prioritization and Colorization - Dashboard Display', () => {
  // SCEN-150: [edge] ダッシュボード色分け表示機能 - 優先度スコアが高い課題に赤色ハイライトが適用される
  test('should apply red highlight color code to high priority score issues on dashboard', () => {
    // Arrange: 優先度スコア 75 (高優先度) の課題データを準備
    const highPriorityIssue: IssueSummary = {
      issueId: 'issue-001',
      priorityScore: 75,
      keyword: 'データベース接続エラー',
      impactLevel: 'high',
    };

    const mediumPriorityIssue: IssueSummary = {
      issueId: 'issue-002',
      priorityScore: 50,
      keyword: 'UIレイアウト調整',
      impactLevel: 'medium',
    };

    const lowPriorityIssue: IssueSummary = {
      issueId: 'issue-003',
      priorityScore: 25,
      keyword: 'ドキュメント更新',
      impactLevel: 'low',
    };

    const issues: IssueSummary[] = [
      highPriorityIssue,
      mediumPriorityIssue,
      lowPriorityIssue,
    ];

    // 色分けの境界値設定: 赤 >= 70, 黄 >= 40
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'manager-001',
    };

    // Act: 色分け処理を実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // Assert: 戻り値の構造を検証
    expect(result).toHaveProperty('colorizedIssues');
    expect(result).toHaveProperty('colorDistribution');
    expect(result).toHaveProperty('processedAt');

    // Assert: 戻り値の colorizedIssues が配列であることを検証
    expect(Array.isArray(result.colorizedIssues)).toBe(true);
    expect(result.colorizedIssues.length).toBe(3);

    // Assert: スコア 75 の課題が赤色でハイライトされていることを検証
    const colorizedHighPriorityIssue = result.colorizedIssues.find(
      (item) => item.issueId === 'issue-001'
    );
    expect(colorizedHighPriorityIssue).toBeDefined();
    expect(colorizedHighPriorityIssue?.highlightColor).toBe('red');
    expect(colorizedHighPriorityIssue?.shouldHighlight).toBe(true);

    // Assert: スコア 50 の課題が黄色でハイライトされていることを検証
    const colorizedMediumPriorityIssue = result.colorizedIssues.find(
      (item) => item.issueId === 'issue-002'
    );
    expect(colorizedMediumPriorityIssue).toBeDefined();
    expect(colorizedMediumPriorityIssue?.highlightColor).toBe('yellow');
    expect(colorizedMediumPriorityIssue?.shouldHighlight).toBe(true);

    // Assert: スコア 25 の課題が緑色でハイライトされていることを検証
    const colorizedLowPriorityIssue = result.colorizedIssues.find(
      (item) => item.issueId === 'issue-003'
    );
    expect(colorizedLowPriorityIssue).toBeDefined();
    expect(colorizedLowPriorityIssue?.highlightColor).toBe('green');
    expect(colorizedLowPriorityIssue?.shouldHighlight).toBe(true);

    // Assert: 色分け配分の検証 (赤: 1件, 黄: 1件, 緑: 1件)
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(1);

    // Assert: processedAt が ISO 8601 形式の日時文字列であることを検証
    expect(typeof result.processedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.processedAt)).toBe(
      true
    );
  });
});