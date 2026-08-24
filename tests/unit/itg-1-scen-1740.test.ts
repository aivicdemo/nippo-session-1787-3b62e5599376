import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  test('SCEN-1740: Keywords at threshold frequency are correctly classified into medium priority rank', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'データベース接続エラー',
          frequency: 5,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(50),
      classifyIssueSeverity: jest.fn().mockResolvedValue('中'),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0]).toMatchObject({
      keyword: 'データベース接続エラー',
      frequency: 5,
      rank: 1,
    });

    expect(result.keywords[0].priorityScore).toBeGreaterThanOrEqual(45);
    expect(result.keywords[0].priorityScore).toBeLessThanOrEqual(55);

    expect(result.keywords[0].priorityRank).toBe('中');

    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisPeriodDays).toBe(7);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-001',
      })
    );

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
      expect.objectContaining({
        occurrenceFrequency: 5,
      })
    );

    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalled();
  });
});