import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-1161: [edge] 課題データ有効性検証機能 - 抽出課題の影響度スコアが優先度ランク分岐点（60点）未満で低優先度に分類される
  test('should classify extracted issue as low priority when impact score is 59 (below 60-point threshold)', async () => {
    const testTeamId = 'team-001';
    const testUserId = 'user-test-001';
    const testStartDate = new Date('2024-01-08T00:00:00Z');
    const testEndDate = new Date('2024-01-14T23:59:59Z');

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続タイムアウト',
            frequency: 2,
            confidence: 0.85,
          },
        ],
        totalExtracted: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'データベース接続タイムアウト',
        impactScore: 59,
        affectedTeams: 1,
        severity: 'low',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: testTeamId,
      startDate: testStartDate,
      endDate: testEndDate,
      minFrequencyThreshold: 1,
      requestUserId: testUserId,
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
    );

    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0]).toMatchObject({
      keyword: 'データベース接続タイムアウト',
      frequency: 2,
      rank: 1,
    });

    expect(result.totalKeywordCount).toBe(1);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'データベース接続タイムアウト',
        frequency: 2,
      }),
    );

    const impactScoreResult = await mockTextAnalysisAdapter.assessImpactScore({
      keyword: 'データベース接続タイムアウト',
      frequency: 2,
    });

    expect(impactScoreResult.impactScore).toBe(59);
    expect(impactScoreResult.impactScore).toBeLessThan(60);
    expect(impactScoreResult.severity).toBe('low');
  });
});