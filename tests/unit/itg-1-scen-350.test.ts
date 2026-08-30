import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import { type Report, type RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('extractAndRankIssuesFromReports', () => {
  test('SCEN-350: should skip empty and whitespace-only issue descriptions and return only valid extracted issues', () => {
    const analysisStartDate = new Date('2024-12-16T00:00:00Z');
    const analysisEndDate = new Date('2025-01-15T00:00:00Z');

    const reports: Report[] = [
      {
        reportId: 'report-001',
        reportDate: new Date('2025-01-15T09:00:00Z'),
        issueText: '',
        teamId: 'team-001',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2025-01-15T09:30:00Z'),
        issueText: '   ',
        teamId: 'team-001',
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2025-01-15T10:00:00Z'),
        issueText: 'ビルド失敗',
        teamId: 'team-001',
      },
    ];

    const mockExtractKeywords = jest.fn();
    mockExtractKeywords.mockReturnValue([]);
    mockExtractKeywords.mockReturnValueOnce([]);
    mockExtractKeywords.mockReturnValueOnce([]);
    mockExtractKeywords.mockReturnValueOnce([
      { keywordId: 'kw-001', keywordName: 'ビルド失敗', confidenceScore: 75 },
    ]);

    const mockNormalizeAndDeduplicate = jest.fn((input) => input);
    const mockCalculateFrequencyRanking = jest.fn((input) => input);
    const mockCombineFrequencyAndImpact = jest.fn((input) => input);
    const mockApplyColorCoding = jest.fn((input) => input);
    const mockCalculatePriorityScore = jest.fn((input) => input);

    const result: RankedIssueList = extractAndRankIssuesFromReports(
      {
        reports,
        analysisStartDate,
        analysisEndDate,
        minimumConfidenceThreshold: 50,
      },
      {
        extractKeywords: mockExtractKeywords,
        normalizeAndDeduplicate: mockNormalizeAndDeduplicate,
        calculateFrequencyRanking: mockCalculateFrequencyRanking,
        combineFrequencyAndImpact: mockCombineFrequencyAndImpact,
        applyColorCoding: mockApplyColorCoding,
        calculatePriorityScore: mockCalculatePriorityScore,
      }
    );

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].keyword).toBe('ビルド失敗');
    expect(result.totalIssueCount).toBe(1);
    expect(result.lowConfidenceIssueCount).toBe(0);
    expect(result.analysisTimestamp).toBeInstanceOf(Date);
  });
});