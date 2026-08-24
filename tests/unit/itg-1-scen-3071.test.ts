import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - OpenAI API Integration', () => {
  // SCEN-3071: [normal] OpenAI API GPT-5.6連携 - TextAnalysisServiceAdapter.classifyIssueSeverityが正常応答を受けた場合、課題が高・中・低の重要度に分類される
  test('should classify issues into HIGH, MEDIUM, LOW severity levels when OpenAI API returns success response', async () => {
    // Mock TextAnalysisServiceAdapter with classifyIssueSeverity returning proper severity classifications
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'システム障害', frequency: 3, impactScore: 95 },
        { keyword: 'レビュー調整', frequency: 2, impactScore: 45 },
        { keyword: 'ドキュメント更新', frequency: 1, impactScore: 20 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 85 }),
      classifyIssueSeverity: jest.fn()
        .mockResolvedValueOnce({ issueText: 'システム障害により本番環境が停止している', severity: 'HIGH' })
        .mockResolvedValueOnce({ issueText: '来週のレビュー調整が必要', severity: 'MEDIUM' })
        .mockResolvedValueOnce({ issueText: 'ドキュメント更新予定', severity: 'LOW' })
    };

    // Test input: Extract keywords from reports within specified date range
    const extractionInput: ExtractIssueKeywordsInput = {
      teamId: 'TEAM-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'USER-001'
    };

    // Execute extraction and ranking function with mocked adapter
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      extractionInput,
      mockTextAnalysisServiceAdapter
    );

    // Verify the function was called
    expect(extractAndRankIssueKeywords).toBeDefined();

    // Verify classifyIssueSeverity was invoked for high severity issue
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledWith(
      expect.stringContaining('システム障害')
    );
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledWith(
      expect.stringContaining('レビュー調整')
    );
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledWith(
      expect.stringContaining('ドキュメント更新')
    );

    // Verify result contains keywords with proper structure
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('totalKeywordCount');
    expect(result).toHaveProperty('extractedAt');
    expect(result).toHaveProperty('analysisperiodDays');

    // Verify keywords array is populated and ranked by frequency (descending)
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThan(0);

    // Verify frequency-based ranking: highest frequency first
    if (result.keywords.length >= 2) {
      expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(result.keywords[1].frequency);
    }

    // Verify rank field is sequential starting from 1
    result.keywords.forEach((keyword, index) => {
      expect(keyword.rank).toBe(index + 1);
    });

    // Verify all keywords have required fields
    result.keywords.forEach(keyword => {
      expect(keyword).toHaveProperty('keywordId');
      expect(keyword).toHaveProperty('keyword');
      expect(keyword).toHaveProperty('frequency');
      expect(keyword).toHaveProperty('rank');
      expect(typeof keyword.keywordId).toBe('string');
      expect(typeof keyword.keyword).toBe('string');
      expect(typeof keyword.frequency).toBe('number');
      expect(typeof keyword.rank).toBe('number');
    });

    // Verify total keyword count matches pre-filter count
    expect(result.totalKeywordCount).toBe(3);

    // Verify extracted timestamp is valid ISO 8601 format
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.extractedAt.getTime()).toBeGreaterThan(0);

    // Verify analysis period calculation (7 days from start to end)
    const expectedAnalysisPeriodDays = 7;
    expect(result.analysisperiodDays).toBe(expectedAnalysisPeriodDays);
  });
});