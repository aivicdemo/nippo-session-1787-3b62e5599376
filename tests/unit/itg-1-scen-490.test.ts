import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題自動抽出・優先度判定機能', () => {
  test('SCEN-490: チームメンバー数が0のときエラーになる', () => {
    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
      teamMemberCount: 0,
    };

    expect(() => extractAndRankIssueKeywords(input)).toThrow(/チームメンバー数/);
  });
});