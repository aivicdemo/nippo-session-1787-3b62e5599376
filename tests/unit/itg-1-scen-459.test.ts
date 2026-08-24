import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-459: [edge] 課題自動抽出・優先度判定機能 - 抽出された課題キーワードの出現頻度が閾値を超過した場合、優先度スコア計算に反映される
  it('should apply frequency bonus to priority score when keyword occurrence exceeds threshold', async () => {
    // Setup: TextAnalysisServiceAdapter mock
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 12,
            confidence: 0.95
          }
        ],
        totalKeywordCount: 1
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'データベース接続エラー',
        baseScore: 50,
        impactScore: 50
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: 'データベース接続エラー',
        severity: 'high'
      })
    };

    // Input data
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const reportingText = '昨日やったこと：システム調査。今日やること：修正対応。抱えている課題：データベース接続エラーが繰り返し発生している';
    const minFrequencyThreshold = 10;
    const requestUserId = 'user-001';

    // Execute
    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId
      },
      mockTextAnalysisService
    );

    // Verify mock was called with correct parameters
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        text: reportingText,
        teamId: teamId,
        startDate: startDate,
        endDate: endDate
      })
    );

    // Verify impact score assessment was called
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'データベース接続エラー'
      })
    );

    // Validate result structure
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('totalKeywordCount');
    expect(result).toHaveProperty('extractedAt');
    expect(result).toHaveProperty('analysisperiodDays');

    // Validate keyword ranking
    expect(result.keywords).toHaveLength(1);
    const rankedKeyword = result.keywords[0];

    // Verify keyword properties
    expect(rankedKeyword).toHaveProperty('keywordId');
    expect(rankedKeyword).toHaveProperty('keyword');
    expect(rankedKeyword.keyword).toBe('データベース接続エラー');
    expect(rankedKeyword).toHaveProperty('frequency');
    expect(rankedKeyword.frequency).toBe(12);
    expect(rankedKeyword).toHaveProperty('rank');
    expect(rankedKeyword.rank).toBe(1);

    // Verify priority score calculation with frequency bonus
    // Base score: 50
    // Frequency bonus: (12 - 10) * 5 = 2 * 5 = 10
    // Total priority score: 50 + 10 = 60
    expect(rankedKeyword).toHaveProperty('priorityScore');
    expect(rankedKeyword.priorityScore).toBe(60);

    // Verify analysis period
    expect(result.analysisperiodDays).toBe(7);

    // Verify total keyword count
    expect(result.totalKeywordCount).toBe(1);

    // Verify extracted timestamp is recent
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.extractedAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });
});