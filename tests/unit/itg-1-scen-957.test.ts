import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  test('SCEN-957: TextAnalysisServiceAdapter タイムアウトでキャッシュフォールバック失敗時は手動入力切り替えエラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockRejectedValue(new Error('Assessment timeout')),
      classifyIssueSeverity: jest.fn(),
    };

    const mockCacheStorage = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      clear: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-20240115-001',
      issueContent: 'システム障害により業務が停止している',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(
      input,
      mockTextAnalysisServiceAdapter,
      mockCacheStorage
    );

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockCacheStorage.get).toHaveBeenCalledWith(`issue-${input.issueId}`);

    expect(result).toEqual({
      issueId: 'issue-20240115-001',
      priorityScore: null,
      priorityRank: null,
      scoreBreakdown: null,
      colorCode: null,
      calculatedAt: expect.any(String),
      error: {
        message: '課題分析が一時的に利用できません。手動入力をご利用ください',
        code: 'ANALYSIS_UNAVAILABLE',
        requiresManualInput: true,
      },
    });

    expect(result.priorityScore).toBeNull();
    expect(result.colorCode).toBeNull();
    expect(result.error?.requiresManualInput).toBe(true);
  });
});