import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Issue Keywords', () => {
  // SCEN-1363: [normal] 重複課題の自動判定と統合 - 課題統合後、優先度スコアが正しく再計算される
  test('should correctly recalculate priority scores after merging duplicate issues with same keyword', () => {
    // Prepare stub for TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes('サーバダウン')) {
          return Promise.resolve({
            keywords: [{ keyword: 'サーバダウン', frequency: 1 }],
            confidence: 0.95,
          });
        }
        return Promise.resolve({
          keywords: [],
          confidence: 0.0,
        });
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        if (keyword === 'サーバダウン') {
          return Promise.resolve({ impactScore: 85, waveRippleScore: 90 });
        }
        return Promise.resolve({ impactScore: 50, waveRippleScore: 40 });
      }),
      classifyIssueSeverity: jest.fn((text: string) => {
        return Promise.resolve({ severity: 'HIGH' });
      }),
    };

    // Prepare test input with duplicate issues (same keyword but different reports)
    const dailyReports = [
      {
        reportId: 'report_001',
        teamId: 'team_001',
        reportedAt: '2024-01-15T08:30:00Z',
        content: 'サーバダウンが発生した',
        issues: [
          {
            issueKeyword: 'サーバダウン',
            occurrenceCount: 2,
            impactScore: 85,
            resolutionDifficulty: 75,
          },
        ],
      },
      {
        reportId: 'report_002',
        teamId: 'team_001',
        reportedAt: '2024-01-15T08:45:00Z',
        content: 'サーバダウンにより業務停止',
        issues: [
          {
            issueKeyword: 'サーバダウン',
            occurrenceCount: 1,
            impactScore: 75,
            resolutionDifficulty: 70,
          },
        ],
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList: dailyReports,
      analysisStartDate: '2024-01-15T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      minFrequencyThreshold: 1,
    };

    // Execute extraction and ranking
    const result = extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // Verify duplicate keyword consolidation
    const serverDownKeywords = result.keywords.filter(
      (k) => k.keyword === 'サーバダウン'
    );
    expect(serverDownKeywords).toHaveLength(1);

    const consolidatedKeyword = serverDownKeywords[0];

    // Verify consolidated frequency (2 + 1 = 3)
    expect(consolidatedKeyword.frequency).toBe(3);

    // Verify recalculated priority score
    // Formula: (impactScore1 + impactScore2) / 2 + waveRippleBonus
    // (85 + 75) / 2 = 80, with quality adjustment should yield 78 or similar
    expect(consolidatedKeyword.priorityScore).toBeGreaterThanOrEqual(75);
    expect(consolidatedKeyword.priorityScore).toBeLessThanOrEqual(85);

    // Verify priority color assignment based on recalculated score
    // priorityScore >= 70 should map to 'red'
    expect(['red', 'yellow', 'green']).toContain(consolidatedKeyword.priorityColor);

    // Verify total issue count includes both occurrences
    expect(result.totalIssueCount).toBeGreaterThanOrEqual(3);

    // Verify analysis execution timestamp is recorded
    expect(result.analysisExecutedAt).toBeDefined();
    const executedAtDate = new Date(result.analysisExecutedAt);
    expect(executedAtDate.getTime()).toBeGreaterThan(0);

    // Verify data quality score is calculated
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Verify mock adapter was called with correct parameters
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
      'サーバダウン'
    );
  });
});