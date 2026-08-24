import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue extraction and ranking - threshold filtering', () => {
  // SCEN-458: [edge] 課題自動抽出・優先度判定機能 - 抽出された課題キーワードの出現頻度が閾値未満の場合、優先度スコアに含められない
  test('should exclude keywords with frequency below threshold from priority score calculation', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '遅延', frequency: 2 },
          { keyword: 'バグ', frequency: 1 }
        ],
        threshold: 5
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'placeholder',
        impactScore: 0
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: 'placeholder',
        severity: 'low'
      })
    };

    const reportText = 'システム遅延が発生。バグ修正中。';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');
    const minFrequencyThreshold = 5;
    const requestUserId = 'user-001';

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

    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledWith(
      expect.objectContaining({
        keywords: expect.not.arrayContaining([
          expect.objectContaining({ keyword: '遅延' }),
          expect.objectContaining({ keyword: 'バグ' })
        ])
      })
    );

    expect(result.keywords).toEqual([]);
    expect(result.totalKeywordCount).toBe(2);
    expect(result.extractedAt).toEqual(expect.any(Date));
    expect(result.analysisperiodDays).toBe(31);
  });
});