import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Extract and Rank Issue Keywords', () => {
  let mockTextAnalysisAdapter: any;

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database_performance', frequency: 2 },
          { keyword: 'api_latency', frequency: 1 }
        ],
        confidence: 0.95
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 75 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1748
  test('should extract and rank issue keywords for previous week Monday through Sunday aggregation period with all reports included', async () => {
    const previousMonday = new Date('2024-01-08T00:00:00Z');
    const previousSunday = new Date('2024-01-14T23:59:59Z');

    const mockReports = [
      {
        reportId: 'report_001',
        userId: 'user_A',
        teamId: 'team_001',
        createdAt: new Date('2024-01-08T09:30:00Z'),
        challenges: 'We are facing database performance issues during peak hours'
      },
      {
        reportId: 'report_002',
        userId: 'user_B',
        teamId: 'team_001',
        createdAt: new Date('2024-01-08T10:15:00Z'),
        challenges: 'API latency has increased and database performance is degraded'
      },
      {
        reportId: 'report_003',
        userId: 'user_C',
        teamId: 'team_001',
        createdAt: new Date('2024-01-08T11:00:00Z'),
        challenges: 'Database performance optimization needed urgently'
      }
    ];

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team_001',
      startDate: previousMonday,
      endDate: previousSunday,
      minFrequencyThreshold: 1,
      requestUserId: 'user_admin'
    };

    mockTextAnalysisAdapter.extractKeywords.mockResolvedValueOnce({
      keywords: [
        { keyword: 'database_performance', frequency: 3 },
        { keyword: 'api_latency', frequency: 1 }
      ],
      confidence: 0.98
    });

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'database_performance',
      frequency: 3,
      rank: 1
    });
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'api_latency',
      frequency: 1,
      rank: 2
    });

    expect(result.totalKeywordCount).toBe(2);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toEqual(expect.any(Date));

    const allReportsWithinPeriod = mockReports.every(
      report => report.createdAt >= previousMonday && report.createdAt <= previousSunday
    );
    expect(allReportsWithinPeriod).toBe(true);

    const reportDatesAreMonday = mockReports.every(
      report => {
        const reportDate = new Date(report.createdAt);
        return reportDate.getTime() >= new Date('2024-01-08T00:00:00Z').getTime() &&
               reportDate.getTime() <= new Date('2024-01-08T23:59:59Z').getTime();
      }
    );
    expect(reportDatesAreMonday).toBe(true);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team_001',
        startDate: previousMonday,
        endDate: previousSunday
      })
    );
  });
});