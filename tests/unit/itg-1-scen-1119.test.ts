import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  test('SCEN-1119: filters out noise keywords identified from irrelevant context words', async () => {
    // Stub implementation of TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { word: 'the', frequency: 5 },
          { word: 'a', frequency: 3 },
          { word: 'データベース', frequency: 2 },
          { word: 'バグ', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue(0),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium')
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001'
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    // Verify that noise keywords ('the' and 'a') are excluded from the result
    const extractedKeywordTexts = result.keywords.map((k) => k.keyword);
    expect(extractedKeywordTexts).not.toContain('the');
    expect(extractedKeywordTexts).not.toContain('a');

    // Verify that business-relevant keywords are retained
    expect(extractedKeywordTexts).toContain('データベース');
    expect(extractedKeywordTexts).toContain('バグ');

    // Verify ranking order: higher frequency first
    const databaseKeyword = result.keywords.find((k) => k.keyword === 'データベース');
    const bugKeyword = result.keywords.find((k) => k.keyword === 'バグ');

    expect(databaseKeyword).toBeDefined();
    expect(bugKeyword).toBeDefined();

    if (databaseKeyword && bugKeyword) {
      expect(databaseKeyword.rank).toBeLessThan(bugKeyword.rank);
      expect(databaseKeyword.frequency).toBe(2);
      expect(bugKeyword.frequency).toBe(1);
    }

    // Verify total keyword count reflects pre-filtered count
    expect(result.totalKeywordCount).toBe(4);

    // Verify extracted metadata
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(31);
  });
});