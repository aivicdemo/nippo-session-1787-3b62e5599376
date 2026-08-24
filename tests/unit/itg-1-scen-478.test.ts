import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Keyword Ranking by Impact Score', () => {
  // SCEN-478
  test('should rank issue keywords in descending order by priority score derived from impact assessment', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    mockTextAnalysisAdapter.assessImpactScore
      .mockResolvedValueOnce({ impactScore: 85 })
      .mockResolvedValueOnce({ impactScore: 45 })
      .mockResolvedValueOnce({ impactScore: 72 });

    mockTextAnalysisAdapter.extractKeywords.mockResolvedValue({
      keywords: [
        { keyword: 'サーバー障害', frequency: 1 },
        { keyword: '予算調整', frequency: 1 },
        { keyword: '人員不足', frequency: 1 },
      ],
    });

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001',
    };

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
    );

    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0].keyword).toBe('サーバー障害');
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].keyword).toBe('人員不足');
    expect(result.keywords[1].rank).toBe(2);
    expect(result.keywords[2].keyword).toBe('予算調整');
    expect(result.keywords[2].rank).toBe(3);
    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toEqual(expect.any(Date));
  });
});