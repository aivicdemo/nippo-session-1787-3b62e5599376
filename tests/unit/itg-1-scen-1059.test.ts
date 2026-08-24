import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題影響度判定機能 - エラーハンドリング', () => {
  // SCEN-1059
  test('TextAnalysisServiceAdapter.assessImpactScore が失敗したとき、処理がエラーになる', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockRejectedValue(
        new Error('API call failed: TextAnalysisService timeout')
      ),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: 'バグが発生し、リリース遅延のリスクがある',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001',
    };

    expect(() =>
      calculateIssuePriorityScore(input, mockTextAnalysisAdapter)
    ).toThrow(/API call failed/);
  });
});