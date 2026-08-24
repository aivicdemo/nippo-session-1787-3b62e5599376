import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2236
  test('reportContentが未定義のときTypeErrorが発生する', () => {
    const invalidReport = {
      userId: 'user1',
      yesterdayWork: 'task A',
      todayWork: 'task B',
      issues: 'issue text'
    };

    expect(() => {
      extractAndRankIssueKeywords(invalidReport as any);
    }).toThrow(/reportContent/);
  });
});