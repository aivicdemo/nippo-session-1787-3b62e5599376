import { describe, it, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Data Validation', () => {
  it('should return warning status when occurrence frequency exceeds impact score', async () => {
    // SCEN-1148
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'database_performance',
          frequency: 70,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'database_performance',
        impactScore: 50,
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    const foundKeyword = result.keywords.find(
      (k) => k.keyword === 'database_performance'
    );
    expect(foundKeyword).toBeDefined();

    if (foundKeyword) {
      expect(foundKeyword.frequency).toBe(70);
      expect(foundKeyword.validationStatus).toBe('warning');
      expect(foundKeyword.validationMessage).toMatch(
        /出現頻度とチーム波及度スコアの矛盾を検出/
      );
    }

    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(1);
    expect(result.analysisperiodDays).toBe(7);
  });
});