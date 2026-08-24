import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度スコア色分け表示機能', () => {
  // SCEN-1356
  test('優先度スコアが同値の複数課題が抽出された場合、すべての課題に正確に同じ色が適用される', () => {
    // 優先度スコアが同じ値（75）を持つ課題を3件以上作成
    const issue_1 = {
      issueId: 'ISSUE-001',
      priorityScore: 75,
      keyword: 'データベース接続エラー',
      impactLevel: 'high' as const,
    };

    const issue_2 = {
      issueId: 'ISSUE-002',
      priorityScore: 75,
      keyword: 'API レスポンスタイムアウト',
      impactLevel: 'high' as const,
    };

    const issue_3 = {
      issueId: 'ISSUE-003',
      priorityScore: 75,
      keyword: 'ログイン機能の不具合',
      impactLevel: 'high' as const,
    };

    const issue_4 = {
      issueId: 'ISSUE-004',
      priorityScore: 75,
      keyword: 'ネットワーク遅延',
      impactLevel: 'high' as const,
    };

    // 色分け設定：赤（70以上）、黄（40以上70未満）、緑（40未満）
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [issue_1, issue_2, issue_3, issue_4],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-dept-chief-001',
    };

    // 機能を実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // すべての課題に対して色が適用されたことを確認
    expect(result.colorizedIssues).toHaveLength(4);

    // 優先度スコア75はredThresholdMin（70）以上なので赤色が適用される
    // 期待される色コード：#FF0000（赤）
    const expectedColor = '#FF0000';

    // すべての課題に同じ色が適用されていることを検証
    const color_1 = result.colorizedIssues[0].highlightColor;
    const color_2 = result.colorizedIssues[1].highlightColor;
    const color_3 = result.colorizedIssues[2].highlightColor;
    const color_4 = result.colorizedIssues[3].highlightColor;

    expect(color_1).toBe(expectedColor);
    expect(color_2).toBe(expectedColor);
    expect(color_3).toBe(expectedColor);
    expect(color_4).toBe(expectedColor);

    // すべての色が完全に一致していることをさらに確認
    expect(color_1).toStrictEqual(color_2);
    expect(color_2).toStrictEqual(color_3);
    expect(color_3).toStrictEqual(color_4);

    // 色分布の検証：すべてが赤色に分類される
    expect(result.colorDistribution.red).toBe(4);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);

    // 各課題でハイライト対象フラグが正しく設定されていることを確認
    result.colorizedIssues.forEach((colorized_issue) => {
      expect(colorized_issue.shouldHighlight).toBe(true);
      expect(colorized_issue.highlightColor).toBe(expectedColor);
    });

    // 処理時刻が ISO 8601 形式で記録されていることを確認
    expect(result.processedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});