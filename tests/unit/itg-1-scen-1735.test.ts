import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示（色分け・ハイライト）する機能', () => {
  // SCEN-1735: [error] 課題優先度スコアに基づく色分け表示機能 - 優先度スコア配列が null のとき色分け処理がエラーになる
  it('課題優先度スコア配列が null の状態で色分け処理を実行する場合、エラーハンドリング処理が実行され、型エラーが発生する', () => {
    // 準備：課題優先度スコア配列が null 状態の入力データを構築
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: null as any, // 優先度スコア配列が null
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-001',
    };

    // 実行：prioritizeAndColorizeIssues 関数を呼び出し、エラーを期待
    // エラーハンドリング処理の実行を観測し、TypeError または ReferenceError が発生することを確認
    expect(() => {
      prioritizeAndColorizeIssues(input);
    }).toThrow(/優先度スコア配列|null|undefined/i);
  });
});