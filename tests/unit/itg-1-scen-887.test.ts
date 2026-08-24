import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking - Same Start and End Date', () => {
  // SCEN-887
  test('should extract and rank keywords from reports only on the target date when start and end dates are identical', async () => {
    const targetDate = new Date('2026-01-15T00:00:00Z');
    const dayBefore = new Date('2026-01-14T00:00:00Z');
    const dayAfter = new Date('2026-01-16T00:00:00Z');

    const mockReportsOnTargetDate = [
      {
        reportId: 'report_001',
        teamId: 'team_alpha',
        submittedAt: new Date('2026-01-15T09:00:00Z'),
        content: 'バグ対応を実施しました',
      },
      {
        reportId: 'report_002',
        teamId: 'team_alpha',
        submittedAt: new Date('2026-01-15T10:00:00Z'),
        content: 'バグ対応と納期遅延の調査を行いました',
      },
      {
        reportId: 'report_003',
        teamId: 'team_alpha',
        submittedAt: new Date('2026-01-15T11:00:00Z'),
        content: 'バグ対応に注力しました',
      },
    ];

    const mockReportOutOfRange1 = {
      reportId: 'report_004',
      teamId: 'team_alpha',
      submittedAt: new Date('2026-01-14T09:00:00Z'),
      content: 'パフォーマンス改善を実施',
    };

    const mockReportOutOfRange2 = {
      reportId: 'report_005',
      teamId: 'team_alpha',
      submittedAt: new Date('2026-01-16T09:00:00Z'),
      content: 'セキュリティ脆弱性対応',
    };

    const mockExtractedKeywords = [
      {
        keyword: 'バグ対応',
        frequency: 3,
      },
      {
        keyword: '納期遅延',
        frequency: 1,
      },
    ];

    let capturedReportsForAnalysis: typeof mockReportsOnTargetDate | null = null;

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async (reports: typeof mockReportsOnTargetDate) => {
        capturedReportsForAnalysis = reports;
        return mockExtractedKeywords;
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team_alpha',
      startDate: targetDate,
      endDate: targetDate,
      minFrequencyThreshold: 1,
      requestUserId: 'user_manager_001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter as any
    );

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(1);
    expect(capturedReportsForAnalysis).toEqual(mockReportsOnTargetDate);
    expect(capturedReportsForAnalysis).toHaveLength(3);

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'バグ対応',
      frequency: 3,
      rank: 1,
    });
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: '納期遅延',
      frequency: 1,
      rank: 2,
    });

    expect(result.totalKeywordCount).toBe(2);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(1);
  });
});