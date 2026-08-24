import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { IssueSummary, ColorThresholdConfig, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Colorize Integration', () => {
  // SCEN-1316: [normal] 課題抽出・優先度判定統合処理 - キーワード抽出、影響度判定、優先度計算、色分け表示が一連の処理として実行される
  test('should extract keywords, assess impact, classify severity, calculate priority, and colorize issues in integrated flow', () => {
    // Arrange: 入力データ準備
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85, // 影響度スコア85 + 高重要度での優先度計算結果
        keyword: 'データベース接続',
        impactLevel: 'high'
      },
      {
        issueId: 'issue-002',
        priorityScore: 72, // 中程度の影響度での優先度スコア
        keyword: 'タイムアウト',
        impactLevel: 'medium'
      }
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,      // 70以上が赤色
      yellowThresholdMin: 40    // 40以上70未満が黄色
    };

    const requestedBy = 'user-manager-001';

    // Act: 統合処理実行
    const result = prioritizeAndColorizeIssues(issues, colorThresholds, requestedBy);

    // Assert: 結果の整合性検証

    // 1. 戻り値構造の確認
    expect(result).toBeDefined();
    expect(result.colorizedIssues).toBeDefined();
    expect(Array.isArray(result.colorizedIssues)).toBe(true);
    expect(result.colorDistribution).toBeDefined();
    expect(result.processedAt).toBeDefined();

    // 2. 優先度スコア85の課題が赤色に色分けされることを確認
    const highPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-001'
    );
    expect(highPriorityIssue).toBeDefined();
    if (highPriorityIssue) {
      expect(highPriorityIssue.highlightColor).toBe('red');
      expect(highPriorityIssue.shouldHighlight).toBe(true);
      expect(highPriorityIssue.issueId).toBe('issue-001');
    }

    // 3. 優先度スコア72の課題が赤色に色分けされることを確認（閾値70以上）
    const mediumHighPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-002'
    );
    expect(mediumHighPriorityIssue).toBeDefined();
    if (mediumHighPriorityIssue) {
      expect(mediumHighPriorityIssue.highlightColor).toBe('red');
      expect(mediumHighPriorityIssue.shouldHighlight).toBe(true);
    }

    // 4. 色分布の統計確認
    expect(result.colorDistribution.red).toBe(2); // 赤色課題が2件
    expect(result.colorDistribution.yellow).toBe(0); // 黄色課題が0件
    expect(result.colorDistribution.green).toBe(0); // 緑色課題が0件

    // 5. 処理タイムスタンプの形式確認（ISO 8601形式）
    const processedAtDate = new Date(result.processedAt);
    expect(processedAtDate.getTime()).toBeGreaterThan(0);
    expect(result.processedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // 6. キーワード情報がそのまま保持されていることを確認
    expect(highPriorityIssue?.keyword).toBe('データベース接続');
    expect(mediumHighPriorityIssue?.keyword).toBe('タイムアウト');

    // 7. インパクトレベル情報が保持されていることを確認
    expect(highPriorityIssue?.impactLevel).toBe('high');
    expect(mediumHighPriorityIssue?.impactLevel).toBe('medium');

    // 8. 全課題がハイライト対象として標識されていることを確認（閾値以上の全課題）
    result.colorizedIssues.forEach((issue) => {
      expect(issue.shouldHighlight).toBe(true);
      expect(['red', 'yellow', 'green', 'none']).toContain(issue.highlightColor);
    });
  });
});