import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  it('SCEN-576: チーム波及度スコアがnullのとき影響度スコア計算エラーが発生する', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue(null),
      classifyIssueSeverity: jest.fn(),
    };

    const issueData = {
      issueId: 'issue-001',
      issueContent: 'サーバーダウンの懸念',
      occurrenceFrequency: 5,
      impactScore: null,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    expect(() => {
      calculateIssuePriorityScore(issueData, mockTextAnalysisServiceAdapter);
    }).toThrow(/チーム波及度スコア/);
  });
});