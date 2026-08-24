import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示（色分け・ハイライト）する機能', () => {
  test('SCEN-2770: 色分け強調表示機能 - 影響度スコアに対応する色コードが辞書に定義されていないとき表示処理が失敗する', () => {
    // Arrange: 影響度スコア75に対応する色コードが辞書に存在しない状態を再現
    const issues: PrioritizeAndColorizeIssuesInput['issues'] = [
      {
        issueId: 'issue-001',
        priorityScore: 75,
        keyword: 'サーバーダウンリスク',
        impactLevel: 'high'
      }
    ];

    // 影響度スコア75に対応する色コード定義を意図的に欠落させた色分け設定
    const colorThresholds = {
      redThresholdMin: 80,
      yellowThresholdMin: 50
      // 注意: スコア75は redThresholdMin(80) にも yellowThresholdMin(50) にもマッチしない範囲
      // ただし、実装に応じて yellowThresholdMin(50) 以上ならば黄色が期待されるが、
      // このシナリオでは色コード辞書そのものに75に対応するエントリがない状態を想定
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'user-001'
    };

    // Act & Assert: 色コード辞書にエントリが存在しないため、エラーがスローされることを検証
    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/色コード|color/i);
  });
});