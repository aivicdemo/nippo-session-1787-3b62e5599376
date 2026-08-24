import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Keyword Extraction from Daily Reports', () => {
  // SCEN-2243
  test('should throw ValidationError when reporterId is null in report object', () => {
    const invalidReport = {
      reporterId: null,
      content: '昨日やったこと：テスト実施',
      date: '2026-08-20',
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2026-08-15T00:00:00Z'),
      endDate: new Date('2026-08-20T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
      reports: [invalidReport],
    };

    expect(() => extractAndRankIssueKeywords(input)).toThrow(
      /reporterId is required/
    );
  });
});