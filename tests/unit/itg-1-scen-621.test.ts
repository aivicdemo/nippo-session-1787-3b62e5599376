import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  test('SCEN-621: 抽出された課題リストが空配列のとき例外を発生させる', () => {
    const emptyIssueList: any[] = [];

    expect(() => {
      calculateIssuePriorityScore(emptyIssueList);
    }).toThrow(/抽出された課題リストが空/);
  });
});