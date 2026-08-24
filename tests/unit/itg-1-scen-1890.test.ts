import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題検索・ランク付け機能 - 日付フォーマット検証', () => {
  test('SCEN-1890: 開始日が ISO 8601 形式でないときはフォーマットエラーを返す', () => {
    const invalidStartDates = [
      '2024/01/15',
      '2024-01-15 09:00',
      '15-01-2024',
      '2024-1-15',
      'January 15, 2024',
    ];

    invalidStartDates.forEach((invalidDate) => {
      const input = {
        teamId: 'team-001',
        startDate: new Date(invalidDate),
        endDate: new Date('2024-01-31T23:59:59.999Z'),
        minFrequencyThreshold: 1,
        requestUserId: 'user-001',
      };

      expect(() => extractAndRankIssueKeywords(input)).toThrow(/形式/);
    });
  });
});