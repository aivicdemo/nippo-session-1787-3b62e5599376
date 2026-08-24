import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  test('SCEN-2241: Should throw error when reportDate has invalid date format', () => {
    const invalidDateFormats = [
      '2024-13-45',
      'invalid-date',
      '2024/13/45',
      '2024-02-30',
      '9999-99-99',
      'not-a-date'
    ];

    invalidDateFormats.forEach((invalidDate) => {
      const input = {
        teamId: 'team-001',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-01-31T23:59:59Z'),
        minFrequencyThreshold: 1,
        requestUserId: 'user-123'
      };

      const reportData = {
        reportId: 'report-001',
        teamId: 'team-001',
        reportDate: invalidDate,
        content: 'テスト課題',
        submittedAt: new Date('2024-01-15T09:00:00Z')
      };

      expect(() => {
        extractAndRankIssueKeywords(input, reportData as any);
      }).toThrow(/reportDate|日付形式|日期/);
    });
  });
});