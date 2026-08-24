import { describe, it, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  it('SCEN-1639: 課題キーワード配列が空のとき、エラーを返し外部サービスを呼び出さない', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: 'テスト課題',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
      extractedKeywords: [],
    };

    const result = calculateIssuePriorityScore(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toEqual({
      code: 'INVALID_INPUT',
      message: '課題キーワード配列が空です',
    });
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});