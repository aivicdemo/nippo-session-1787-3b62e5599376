import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList, type IssueSummary, type ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('課題ダッシュボード表示機能 - 優先度スコアに基づく色分け処理', () => {
  // SCEN-518: [edge] 課題ダッシュボード表示機能 - 優先度スコアが最高値100未満で赤色ハイライトが適用されない
  test('優先度スコア99の課題に対して赤色ハイライトが適用されず、黄色またはそれ以下の優先度色で表示される', () => {
    // Arrange: 優先度スコア99の課題データを準備
    const issueWithScore99: IssueSummary = {
      issueId: 'issue-001',
      priorityScore: 99,
      keyword: 'database-connection-timeout',
      impactLevel: 'high'
    };

    const issues: IssueSummary[] = [issueWithScore99];

    // 色分け閾値設定: 赤色は80以上、黄色は50以上
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 80,
      yellowThresholdMin: 50
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'user-division-manager-001'
    };

    // Act: 優先度色分け処理を実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // Assert: スコア99の課題が赤色で色分けされていないことを検証
    expect(result.colorizedIssues).toHaveLength(1);
    
    const colorizedIssue = result.colorizedIssues[0];
    expect(colorizedIssue.issueId).toBe('issue-001');
    expect(colorizedIssue.priorityScore).toBe(99);
    expect(colorizedIssue.keyword).toBe('database-connection-timeout');
    
    // 赤色ハイライト（'red'）が適用されていないことを確認
    // スコア99は80以上100未満なので、赤色閾値より下の優先度色または標準色で表示される
    expect(colorizedIssue.highlightColor).not.toBe('red');
    
    // スコア99は50以上なので、黄色の可能性がある
    expect(['yellow', 'green', 'none']).toContain(colorizedIssue.highlightColor);

    // 色分布の集計を検証
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBeGreaterThanOrEqual(0);
    expect(result.colorDistribution.green).toBeGreaterThanOrEqual(0);

    // processedAt が ISO 8601 形式の日時であることを確認
    expect(result.processedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});