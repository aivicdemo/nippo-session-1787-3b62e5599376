import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア', () => {
  // SCEN-2156: [error] 課題優先度スコア算出機能 - 課題キーワード抽出結果が null のとき、エラーが発生する
  test('should throw error when extractedKeywords is null', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'システム障害により納期遅延が発生',
      occurrenceFrequency: 3,
      impactScore: 85,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'TEAM-A',
    };

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/課題キーワード抽出結果/);
  });
});