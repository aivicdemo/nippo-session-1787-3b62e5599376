import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能 - TextAnalysisServiceAdapter タイムアウト時の再試行失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-958
  test('TextAnalysisServiceAdapter のタイムアウト（30秒）が発生し再試行3回失敗したときエラーを返す', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('API Timeout'));
          }, 31000);
        });
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'API連携エラーが発生しました',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    let result: IssuePriorityScoringOutput | { code: string; message: string; retryCount: number };

    try {
      result = await calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        result = {
          code: (error as { code: string }).code,
          message: error.message,
          retryCount: (error as { retryCount?: number }).retryCount ?? 0,
        };
      } else {
        throw error;
      }
    }

    expect(result).toEqual({
      code: 'TEXT_ANALYSIS_TIMEOUT',
      message: '課題分析が一時的に利用できません。手動入力をご利用ください',
      retryCount: 3,
    });

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(3);
  });
});