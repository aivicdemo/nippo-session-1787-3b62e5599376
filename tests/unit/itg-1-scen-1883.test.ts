import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  // SCEN-1883
  test('検索条件の開始日が指定されていないときエラーを返す', () => {
    const input = {
      teamId: 'team-001',
      startDate: undefined as any,
      endDate: new Date('2026-08-20T23:59:59.999Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    expect(() => extractAndRankIssueKeywords(input)).toThrow(/開始日/);
  });
});