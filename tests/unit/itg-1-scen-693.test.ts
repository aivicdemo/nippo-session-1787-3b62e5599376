import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-693: [edge] 課題優先度色分け機能 - 100 件の課題（業務上の最大規模想定）が正しく色分けされる
  test('should correctly colorize 100 issues with red/yellow/green based on priority scores', () => {
    // テストデータ準備: 高（red）・中（yellow）・低（green）に分類された課題を各33～34件用意
    const redIssues: IssueSummary[] = Array.from({ length: 33 }, (_, i) => ({
      issueId: `issue-red-${i + 1}`,
      priorityScore: 70 + Math.floor(Math.random() * 31), // 70～100
      keyword: `high priority issue ${i + 1}`,
      impactLevel: 'high',
    }));

    const yellowIssues: IssueSummary[] = Array.from({ length: 33 }, (_, i) => ({
      issueId: `issue-yellow-${i + 1}`,
      priorityScore: 40 + Math.floor(Math.random() * 30), // 40～69
      keyword: `medium priority issue ${i + 1}`,
      impactLevel: 'medium',
    }));

    const greenIssues: IssueSummary[] = Array.from({ length: 34 }, (_, i) => ({
      issueId: `issue-green-${i + 1}`,
      priorityScore: Math.floor(Math.random() * 40), // 0～39
      keyword: `low priority issue ${i + 1}`,
      impactLevel: 'low',
    }));

    const allIssues = [...redIssues, ...yellowIssues, ...greenIssues];

    // 色分けのしきい値を定義
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    // 入力パラメータを構築
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: allIssues,
      colorThresholds: colorThresholds,
      requestedBy: 'test-user-001',
    };

    // 機能を実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 結果の基本検証
    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(100);
    expect(result.processedAt).toBeDefined();

    // 色分布を集計
    let redCount = 0;
    let yellowCount = 0;
    let greenCount = 0;

    result.colorizedIssues.forEach((colorizedIssue) => {
      expect(colorizedIssue.issueId).toBeDefined();
      expect(colorizedIssue.highlightColor).toMatch(/^(red|yellow|green)$/);

      switch (colorizedIssue.highlightColor) {
        case 'red':
          redCount += 1;
          break;
        case 'yellow':
          yellowCount += 1;
          break;
        case 'green':
          greenCount += 1;
          break;
      }
    });

    // 色分布の検証
    // 高優先度課題（priorityScore >= 70）は red で色分けされていることを確認
    const highPriorityIssues = result.colorizedIssues.filter(
      (issue) => issue.priorityScore >= 70
    );
    expect(highPriorityIssues.every((issue) => issue.highlightColor === 'red')).toBe(true);
    expect(highPriorityIssues.length).toBe(33);

    // 中優先度課題（40 <= priorityScore < 70）は yellow で色分けされていることを確認
    const mediumPriorityIssues = result.colorizedIssues.filter(
      (issue) => issue.priorityScore >= 40 && issue.priorityScore < 70
    );
    expect(mediumPriorityIssues.every((issue) => issue.highlightColor === 'yellow')).toBe(true);
    expect(mediumPriorityIssues.length).toBe(33);

    // 低優先度課題（priorityScore < 40）は green で色分けされていることを確認
    const lowPriorityIssues = result.colorizedIssues.filter(
      (issue) => issue.priorityScore < 40
    );
    expect(lowPriorityIssues.every((issue) => issue.highlightColor === 'green')).toBe(true);
    expect(lowPriorityIssues.length).toBe(34);

    // 色分布の全体統計を検証
    expect(result.colorDistribution).toBeDefined();
    expect(result.colorDistribution.red).toBe(33);
    expect(result.colorDistribution.yellow).toBe(33);
    expect(result.colorDistribution.green).toBe(34);

    // 合計が100件であることを確認
    const totalColorized =
      result.colorDistribution.red + result.colorDistribution.yellow + result.colorDistribution.green;
    expect(totalColorized).toBe(100);

    // 個別の課題ごとにカラーコードが正しく割り当てられていることを確認
    result.colorizedIssues.forEach((colorizedIssue) => {
      if (colorizedIssue.highlightColor === 'red') {
        expect(colorizedIssue.priorityScore).toBeGreaterThanOrEqual(70);
      } else if (colorizedIssue.highlightColor === 'yellow') {
        expect(colorizedIssue.priorityScore).toBeGreaterThanOrEqual(40);
        expect(colorizedIssue.priorityScore).toBeLessThan(70);
      } else if (colorizedIssue.highlightColor === 'green') {
        expect(colorizedIssue.priorityScore).toBeLessThan(40);
      }
    });
  });
});