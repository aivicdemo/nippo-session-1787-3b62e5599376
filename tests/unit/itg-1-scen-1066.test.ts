import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('ダッシュボード強調表示機能 - 色分け処理エラーハンドリング', () => {
  // SCEN-1066: [error] ダッシュボード強調表示機能 - カラーコード定義が存在しないとき、色分け処理がエラーになる
  test('カラーコード定義が未設定の場合、色分け処理がエラーをthrowしカラーコード定義エラーメッセージを含むこと', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 75,
          keyword: '遅延',
          impactLevel: 'high'
        },
        {
          issueId: 'issue-002',
          priorityScore: 65,
          keyword: '品質',
          impactLevel: 'medium'
        }
      ],
      colorThresholds: {
        redThresholdMin: null as any,
        yellowThresholdMin: null as any
      } as unknown as ColorThresholdConfig,
      requestedBy: 'user-001'
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/カラーコード定義/);
  });
});