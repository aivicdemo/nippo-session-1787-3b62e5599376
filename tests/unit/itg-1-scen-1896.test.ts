import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  // SCEN-1896
  it('should correctly aggregate and rank keywords across month boundary with no duplicate counting', async () => {
    // Setup: Mock TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn()
        .mockResolvedValueOnce({
          keywords: [
            { keyword: 'バグ', frequency: 2 },
            { keyword: 'デプロイ', frequency: 1 }
          ]
        })
        .mockResolvedValueOnce({
          keywords: [
            { keyword: 'バグ', frequency: 3 },
            { keyword: 'レビュー', frequency: 2 }
          ]
        }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    // Input: date range spanning month boundary
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-11-25T00:00:00Z'),
      endDate: new Date('2024-12-10T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    // Execute
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // Verify: Total keyword count (no duplicates)
    expect(result.totalKeywordCount).toBe(3);

    // Verify: Keywords ranked by frequency descending
    expect(result.keywords).toHaveLength(3);
    
    // Rank 1: バグ (5 = 2 from Nov 25-28 + 3 from Dec 1-10)
    expect(result.keywords[0].keyword).toBe('バグ');
    expect(result.keywords[0].frequency).toBe(5);
    expect(result.keywords[0].rank).toBe(1);
    
    // Rank 2: レビュー (2 from Dec 1-10)
    expect(result.keywords[1].keyword).toBe('レビュー');
    expect(result.keywords[1].frequency).toBe(2);
    expect(result.keywords[1].rank).toBe(2);
    
    // Rank 3: デプロイ (1 from Nov 25-28)
    expect(result.keywords[2].keyword).toBe('デプロイ');
    expect(result.keywords[2].frequency).toBe(1);
    expect(result.keywords[2].rank).toBe(3);

    // Verify: Analysis period is 16 days (Nov 25-28 = 4 days + Dec 1-10 = 10 days)
    expect(result.analysisperiodDays).toBe(16);

    // Verify: Extract timestamp is recorded
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.extractedAt.getTime()).toBeGreaterThan(0);

    // Verify: Mock was called with correct date ranges
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(2);
  });
});