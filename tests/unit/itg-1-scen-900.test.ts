import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-900
  test('[error] 日報テキストが空文字列のとき課題抽出が失敗し例外をスローする', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(() => {
        throw new Error('Cannot extract keywords from empty text');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T10:00:00Z',
      teamId: 'team-001',
    };

    expect(() =>
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/Cannot extract keywords from empty text/);
  });
});