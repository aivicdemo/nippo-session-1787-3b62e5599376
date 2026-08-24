import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('ダッシュボード色分け表示機能', () => {
  test('SCEN-1312: 0件の課題に対して空のダッシュボード表示が生成される', () => {
    // 入力: 空の課題リスト
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-001',
    };

    // 実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 検証: 空のダッシュボード表示が生成されている
    expect(result).toEqual({
      colorizedIssues: [],
      colorDistribution: {
        red: 0,
        yellow: 0,
        green: 0,
      },
      processedAt: expect.any(String),
    });

    // 色分けされた課題が存在しないことを確認
    expect(result.colorizedIssues).toHaveLength(0);

    // 色分け分布がすべてゼロであることを確認
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);

    // 処理実行日時がISO 8601形式で記録されていることを確認
    expect(result.processedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});