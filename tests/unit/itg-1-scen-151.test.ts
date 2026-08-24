import { describe, it, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示（色分け・ハイライト）する機能', () => {
  // SCEN-151: [edge] ダッシュボード色分け表示機能 - 優先度スコアが中程度の課題に黄色ハイライトが適用される
  it('スコア50の課題に黄色ハイライトが適用される', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'ISSUE-001',
          priorityScore: 50,
          keyword: '顧客対応遅延',
          impactLevel: 'medium'
        },
        {
          issueId: 'ISSUE-002',
          priorityScore: 75,
          keyword: 'システムダウン',
          impactLevel: 'high'
        },
        {
          issueId: 'ISSUE-003',
          priorityScore: 25,
          keyword: 'ドキュメント更新',
          impactLevel: 'low'
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'user-001'
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // スコア50の課題が黄色に分類されることを確認
    const mediumIssue = result.colorizedIssues.find(issue => issue.issueId === 'ISSUE-001');
    expect(mediumIssue).toBeDefined();
    expect(mediumIssue?.highlightColor).toBe('yellow');

    // スコア75以上の課題が赤に分類されることを確認
    const highIssue = result.colorizedIssues.find(issue => issue.issueId === 'ISSUE-002');
    expect(highIssue).toBeDefined();
    expect(highIssue?.highlightColor).toBe('red');

    // スコア40未満の課題が緑に分類されることを確認
    const lowIssue = result.colorizedIssues.find(issue => issue.issueId === 'ISSUE-003');
    expect(lowIssue).toBeDefined();
    expect(lowIssue?.highlightColor).toBe('green');

    // 色分布が正しく集計されることを確認
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(1);

    // processedAt が ISO 8601 形式で記録されることを確認
    expect(result.processedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 返却される課題リストが入力と同じ件数であることを確認
    expect(result.colorizedIssues.length).toBe(3);
  });
});