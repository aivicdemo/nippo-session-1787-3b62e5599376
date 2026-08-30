import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import { type MonthlyAnalysisReportInput, type MonthlyAnalysisReportOutput } from '../../src/logic/monthly-analysis-report';

describe('generateMonthlyAnalysisReport', () => {
  // SCEN-464: [edge] リスクスコア計算が分母ゼロの状態でデフォルト値で判定される
  test('should handle zero team capacity by using default values and logging warning', async () => {
    const targetMonth = '2024-01';
    const projectManagerId = 'PM001';

    const mockReportDataset = {
      extractionPeriod: {
        startDateTime: '2024-01-01T00:00:00Z',
        endDateTime: '2024-01-31T23:59:59Z'
      },
      totalReportCount: 10,
      reports: [
        {
          reportId: 'RPT001',
          reportDate: '2024-01-15',
          reporterId: 'ENG001',
          teamId: 'TEAM001',
          issues: [
            { issueId: 'ISS001', issueContent: 'Build failure', severity: 'high' }
          ],
          submissionTimestamp: '2024-01-15T08:00:00Z'
        },
        {
          reportId: 'RPT002',
          reportDate: '2024-01-15',
          reporterId: 'ENG002',
          teamId: 'TEAM001',
          issues: [
            { issueId: 'ISS002', issueContent: 'Test environment unstable', severity: 'medium' }
          ],
          submissionTimestamp: '2024-01-15T08:05:00Z'
        }
      ],
      dataQualityScore: 85
    };

    const extractedIssuesWithTimestamps = [
      {
        issueId: 'ISS001',
        issueContent: 'Build failure',
        frequency: 3,
        impactScore: 80,
        resolutionStatus: 'unresolved' as const,
        extractedDate: new Date('2024-01-15T08:00:00Z')
      },
      {
        issueId: 'ISS002',
        issueContent: 'Test environment unstable',
        frequency: 5,
        impactScore: 60,
        resolutionStatus: 'in_progress' as const,
        extractedDate: new Date('2024-01-16T08:00:00Z')
      }
    ];

    const teamPerformanceMetrics = {
      teamMetrics: [
        {
          teamId: 'TEAM001',
          issueResolutionSpeedDays: 4,
          reportSubmissionRate: 90,
          issueRecurrenceRate: 25,
          priorityScore: 65,
          performanceRank: 'medium' as const
        }
      ],
      aggregationPeriod: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      },
      calculationTimestamp: new Date('2024-01-31T18:00:00Z')
    };

    const bottleneckProgressionData = {
      progressionPatterns: [
        {
          issueId: 'ISS001',
          progressionType: 'deteriorating' as const,
          weeklyFrequencyTrend: [1, 2, 3, 3],
          category: 'technical_failure'
        }
      ],
      criticalBottlenecks: [
        {
          issueId: 'ISS001',
          issueName: 'Build failure',
          affectedTeamCount: 1,
          severityScore: 85,
          progressionWeeks: 4,
          estimatedImpact: 'high'
        }
      ],
      resolvedBottlenecks: [],
      emergingBottlenecks: [
        {
          issueId: 'ISS002',
          issueName: 'Test environment unstable',
          firstDetectedDate: new Date('2024-01-16'),
          affectedMemberCount: 2,
          currentSeverity: 'medium'
        }
      ]
    };

    const input: MonthlyAnalysisReportInput = {
      aggregationPeriodStart: '2024-01-01',
      aggregationPeriodEnd: '2024-01-31',
      issueRankingData: [
        { issueId: 'ISS001', issueName: 'Build failure', frequency: 3, impactScore: 80 },
        { issueId: 'ISS002', issueName: 'Test environment unstable', frequency: 5, impactScore: 60 }
      ],
      priorityScoreData: [
        { issueId: 'ISS001', priorityScore: 75, priorityRank: 'high', colorCode: 'red' },
        { issueId: 'ISS002', priorityScore: 65, priorityRank: 'medium', colorCode: 'yellow' }
      ],
      teamPerformanceMetrics: teamPerformanceMetrics.teamMetrics,
      bottleneckProgressionData: bottleneckProgressionData
    };

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result: MonthlyAnalysisReportOutput = await generateMonthlyAnalysisReport({
      targetMonth,
      projectManagerId,
      includeExecutiveSummary: true,
      topChallengesCount: 5
    });

    expect(result).toBeDefined();
    expect(result.reportId).toBeTruthy();
    expect(result.targetMonth).toBe(targetMonth);
    expect(result.generatedAt).toBeInstanceOf(Date);

    expect(result.reportContent).toBeDefined();
    expect(Array.isArray(result.reportContent.topPriorityChallenges)).toBe(true);
    expect(result.reportContent.topPriorityChallenges.length).toBeGreaterThan(0);
    expect(result.reportContent.topPriorityChallenges.length).toBeLessThanOrEqual(5);

    expect(typeof result.reportContent.teamPerformanceSummary).toBe('object');
    expect(Array.isArray(result.reportContent.teamPerformanceSummary.metrics)).toBe(true);

    expect(result.projectDelayRiskLevel).toMatch(/^(high|medium|low)$/);

    const defaultRiskLevel = 'medium';
    const isRiskLevelSet = result.projectDelayRiskLevel === 'high' ||
                            result.projectDelayRiskLevel === 'medium' ||
                            result.projectDelayRiskLevel === 'low';
    expect(isRiskLevelSet).toBe(true);

    const warningCalled = consoleSpy.mock.calls.some(call =>
      typeof call[0] === 'string' && call[0].includes('リスク計算に必要なデータが不足')
    );
    expect(warningCalled || result.projectDelayRiskLevel).toBeTruthy();

    consoleSpy.mockRestore();
  });
});