import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度色分け表示機能', () => {
  // SCEN-656
  test('課題が1件の場合、そのスコアに応じた単一色が正しく適用される', () => {
    // 入力条件：課題スコア45（中程度優先度）
    const testIssue: IssueSummary = {
      issueId: 'issue-001',
      priorityScore: 45,
      keyword: '本番サーバーのメモリ不足',
      impactLevel: 'medium'
    };

    const issues: IssueSummary[] = [testIssue];

    // 色分け設定：赤 >= 70, 黄 >= 40, 緑 < 40
    // スコア45は黄色範囲（40以上70未満）
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40
    };

    const requestedBy = 'user-001';

    // 関数を実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues({
      issues,
      colorThresholds,
      requestedBy
    });

    // 検証：戻り値の構造
    expect(result.colorizedIssues).toBeDefined();
    expect(Array.isArray(result.colorizedIssues)).toBe(true);
    expect(result.colorizedIssues.length).toBe(1);

    // 検証：色分け結果
    const colorizedIssue = result.colorizedIssues[0];
    expect(colorizedIssue.issueId).toBe('issue-001');
    expect(colorizedIssue.keyword).toBe('本番サーバーのメモリ不足');
    expect(colorizedIssue.priorityScore).toBe(45);

    // 検証：スコア45に対応する色は黄色（#FFFF00）のみ
    expect(colorizedIssue.highlightColor).toBe('yellow');

    // 検証：色分布
    expect(result.colorDistribution).toBeDefined();
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(0);

    // 検証：処理実行時刻
    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate).toBeInstanceOf(Date);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});