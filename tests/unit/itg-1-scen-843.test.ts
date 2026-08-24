import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Priority Score Calculation', () => {
  test('SCEN-843: calculateIssuePriorityScore throws error when extracted keywords are empty', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue([]),
      assessImpactScore: jest.fn().mockImplementation(() => {
        throw new Error('抽出キーワードが空のため影響度判定を実行できません');
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: 'サーバーレスポンスが遅い',
      occurrenceFrequency: 3,
      impactScore: 0,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/抽出キーワードが空のため影響度判定/);
  });
});