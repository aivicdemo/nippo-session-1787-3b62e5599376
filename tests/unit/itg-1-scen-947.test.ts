import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  test('SCEN-947: 課題キーワードが空文字のとき優先度スコア計算がエラーを返す', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T08:00:00Z',
      teamId: 'team-dev-001',
      keyword: '',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/キーワード|keyword/i);
  });
});