import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1675
  test('should generate weekly analysis report with correct keyword extraction when text analysis service responds successfully', async () => {
    // Arrange
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'システム障害', occurrenceCount: 3, confidenceScore: 0.95 },
          { keyword: '納期遅延', occurrenceCount: 2, confidenceScore: 0.88 },
          { keyword: 'リソース不足', occurrenceCount: 1, confidenceScore: 0.82 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScores: [
          { keyword: 'システム障害', impactScore: 95 },
          { keyword: '納期遅延', impactScore: 75 },
          { keyword: 'リソース不足', impactScore: 60 }
        ]
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severities: [
          { keyword: 'システム障害', severity: 'high' },
          { keyword: '納期遅延', severity: 'high' },
          { keyword: 'リソース不足', severity: 'medium' }
        ]
      })
    };

    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');

    const reportInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          issueKeyword: 'システム障害',
          occurrenceFrequency: 3,
          impactDegree: 95
        },
        {
          issueKeyword: '納期遅延',
          occurrenceFrequency: 2,
          impactDegree: 75
        },
        {
          issueKeyword: 'リソース不足',
          occurrenceFrequency: 1,
          impactDegree: 60
        }
      ],
      teamId: 'team-001'
    };

    // Act
    const generatedReport: WeeklyAnalysisReport = await generateWeeklyAnalysisReport(
      reportInput,
      mockTextAnalysisAdapter
    );

    // Assert
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: analysisStartDate,
        endDate: analysisEndDate
      })
    );

    expect(generatedReport).toBeDefined();
    expect(generatedReport.reportId).toMatch(/^report-/);
    expect(generatedReport.aggregationPeriod.startDate).toBe('2024-01-08');
    expect(generatedReport.aggregationPeriod.endDate).toBe('2024-01-14');

    expect(generatedReport.issueRanking).toHaveLength(3);
    expect(generatedReport.issueRanking[0]).toEqual({
      issueKeyword: 'システム障害',
      occurrenceCount: 3,
      rank: 1
    });
    expect(generatedReport.issueRanking[1]).toEqual({
      issueKeyword: '納期遅延',
      occurrenceCount: 2,
      rank: 2
    });
    expect(generatedReport.issueRanking[2]).toEqual({
      issueKeyword: 'リソース不足',
      occurrenceCount: 1,
      rank: 3
    });

    expect(generatedReport.priorityScores).toHaveLength(3);
    expect(generatedReport.priorityScores[0]).toEqual({
      issueId: expect.any(String),
      priorityScore: 95,
      priorityRank: 'high'
    });
    expect(generatedReport.priorityScores[1]).toEqual({
      issueId: expect.any(String),
      priorityScore: 75,
      priorityRank: 'high'
    });
    expect(generatedReport.priorityScores[2]).toEqual({
      issueId: expect.any(String),
      priorityScore: 60,
      priorityRank: 'medium'
    });

    expect(generatedReport.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(generatedReport.recommendedCountermeasures)).toBe(true);
    expect(generatedReport.recommendedCountermeasures.length).toBeGreaterThanOrEqual(1);

    expect(generatedReport.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});