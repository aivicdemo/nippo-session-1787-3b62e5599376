import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList, type IssueSummary, type ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-697: [normal] 優先度別課題ハイライト表示機能 - 課題が複数件の場合、全課題に対してスコア判定と色分け表示が正常に動作する
  test('複数課題入力時に各課題がスコアベースの色分けで表示される', () => {
    // Arrange: 3件の課題データを構成（スコア85, 55, 30）
    const issue_a: IssueSummary = {
      issueId: 'issue-001',
      priorityScore: 85,
      keyword: '認証エラー',
      impactLevel: 'high'
    };

    const issue_b: IssueSummary = {
      issueId: 'issue-002',
      priorityScore: 55,
      keyword: 'パフォーマンス低下',
      impactLevel: 'medium'
    };

    const issue_c: IssueSummary = {
      issueId: 'issue-003',
      priorityScore: 30,
      keyword: 'UIレイアウト崩れ',
      impactLevel: 'low'
    };

    const issues: IssueSummary[] = [issue_a, issue_b, issue_c];

    // 色分け境界値を設定（赤：80以上、黄：50以上80未満、緑：50未満）
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 80,
      yellowThresholdMin: 50
    };

    const requestedBy_user_id = 'user-001';

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: requestedBy_user_id
    };

    // Act: 優先度別ハイライト表示機能を実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // Assert: 結果の構造が正常であることを確認
    expect(result).toHaveProperty('colorizedIssues');
    expect(result).toHaveProperty('colorDistribution');
    expect(result).toHaveProperty('processedAt');

    // 3件すべての課題がカラーライズされたことを確認
    expect(result.colorizedIssues).toHaveLength(3);

    // 課題A（スコア85）が赤色で表示されることを確認
    const colorized_issue_a = result.colorizedIssues.find(ci => ci.issueId === 'issue-001');
    expect(colorized_issue_a).toBeDefined();
    expect(colorized_issue_a?.shouldHighlight).toBe(true);
    expect(colorized_issue_a?.highlightColor).toBe('red');

    // 課題B（スコア55）が黄色で表示されることを確認
    const colorized_issue_b = result.colorizedIssues.find(ci => ci.issueId === 'issue-002');
    expect(colorized_issue_b).toBeDefined();
    expect(colorized_issue_b?.shouldHighlight).toBe(true);
    expect(colorized_issue_b?.highlightColor).toBe('yellow');

    // 課題C（スコア30）が緑色で表示されることを確認
    const colorized_issue_c = result.colorizedIssues.find(ci => ci.issueId === 'issue-003');
    expect(colorized_issue_c).toBeDefined();
    expect(colorized_issue_c?.shouldHighlight).toBe(false);
    expect(colorized_issue_c?.highlightColor).toBe('green');

    // 色分布が正確であることを確認（赤1件、黄1件、緑1件）
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(1);

    // processedAt がISO 8601形式の文字列であることを確認
    expect(typeof result.processedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.processedAt)).toBe(true);
  });
});