import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Keyword Frequency Threshold Promotion', () => {
  test('SCEN-2940: Issue keywords exceeding frequency threshold are promoted to higher rank', async () => {
    // Arrange: Mock TextAnalysisServiceAdapter with stubs
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'データベース接続エラー',
          frequency: 2,
        },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Initial keyword dictionary state
    const initialKeywordData = [
      {
        keywordId: 'kw-001',
        keyword: 'データベース接続エラー',
        currentFrequency: 4,
        currentRank: 3,
      },
      {
        keywordId: 'kw-002',
        keyword: 'UI反応遅延',
        currentFrequency: 7,
        currentRank: 2,
      },
      {
        keywordId: 'kw-003',
        keyword: 'API呼び出し失敗',
        currentFrequency: 2,
        currentRank: 4,
      },
    ];

    // Configuration: threshold for rank promotion is 5 occurrences
    const frequencyThresholdForPromotion = 5;
    const analysisStartDate = new Date('2026-08-19T00:00:00Z');
    const analysisEndDate = new Date('2026-08-19T23:59:59Z');

    // 10 new reports submitted
    const newReportsCount = 10;

    // Act: Extract and rank keywords
    const input = {
      teamId: 'team-001',
      startDate: analysisStartDate,
      endDate: analysisEndDate,
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
      analysisServiceAdapter: mockTextAnalysisService,
      initialKeywordDictionary: initialKeywordData,
      frequencyThresholdForPromotion,
      newReportsCount,
    };

    const result = await extractAndRankIssueKeywords(input);

    // Assert: Verify that 'データベース接続エラー' was promoted
    const databaseErrorKeyword = result.keywords.find(
      (kw) => kw.keyword === 'データベース接続エラー'
    );

    expect(databaseErrorKeyword).toBeDefined();
    expect(databaseErrorKeyword!.frequency).toBe(6); // 4 + 2 = 6
    expect(databaseErrorKeyword!.rank).toBe(2); // Promoted from rank 3 to rank 2

    // Verify promotion history log was created
    expect(result.promotionHistoryLog).toBeDefined();
    const promotionLog = result.promotionHistoryLog.find(
      (log) => log.keyword === 'データベース接続エラー'
    );

    expect(promotionLog).toBeDefined();
    expect(promotionLog!.promotionDate).toBe('2026-08-19');
    expect(promotionLog!.keyword).toBe('データベース接続エラー');
    expect(promotionLog!.previousRank).toBe(3);
    expect(promotionLog!.newRank).toBe(2);
    expect(promotionLog!.frequency).toBe(6);
    expect(promotionLog!.promotionReason).toBe('閾値5回を超過');

    // Verify keywords are ranked in descending frequency order
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(
      result.keywords[1].frequency
    );
    if (result.keywords.length > 1) {
      expect(result.keywords[1].frequency).toBeGreaterThanOrEqual(
        result.keywords[2]?.frequency || 0
      );
    }

    // Verify extraction metadata
    expect(result.totalKeywordCount).toBeGreaterThan(0);
    expect(result.extractedAt).toEqual(analysisEndDate);
    expect(result.analysisperiodDays).toBe(1);
  });
});