import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { prioritizeAndColorizeIssues, type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-724: [error] 優先度別課題ハイライト表示機能 - 課題キーワードが null のとき処理がエラーになる
  test('課題キーワード抽出結果がnullの場合、エラーをスローする', () => {
    const mockIssues: any[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: null,
        impactLevel: 'high'
      }
    ];

    const colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: mockIssues,
      colorThresholds,
      requestedBy: 'user-001'
    };

    expect(() => {
      prioritizeAndColorizeIssues(input);
    }).toThrow(/キーワード/);
  });
});