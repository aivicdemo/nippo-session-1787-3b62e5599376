import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';

describe('Monthly Analysis Report Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-445: [edge] 毎月初に前月の全日報データを抽出し、課題の時系列変化・ボトルネック推移・チーム別パフォーマンス指標を分析してレポートを生成し、プロジェクトマネージャーに通知する。 - チームメンバー10名中、報告提出者が5名未満の場合という明示された境界条件で報告提出率が50%未満です。未提出メンバーへの確認が必要です
  test('should generate monthly analysis report with low submission rate warning when submission count is below 50%', async () => {
    const targetMonth = '2024-01';
    const projectManagerId = 'pm_001';
    const includeExecutiveSummary = true;
    const topChallengesCount = 5;
    
    const teamMemberIds = [
      'member_1', 'member_2', 'member_3', 'member_4', 'member_5',
      'member_6', 'member_7', 'member_8', 'member_9', 'member_10'
    ];
    
    const submittedMemberIds = ['member_1', 'member_2', 'member_3', 'member_4'];
    const submissionRate = (submittedMemberIds.length / teamMemberIds.length) * 100;
    
    const mockMonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: '2024-01-01T00:00:00Z',
        endDateTime: '2024-01-31T23:59:59Z'
      },
      totalReportCount: 12,
      reports: [],
      dataQualityScore: 80,
      teamMembersCovered: submittedMemberIds
    };

    const mockIssueTimeSeriesAnalysisResult = {
      issueTimeSeriesData: [
        {
          issueId: 'issue_1',
          issueContent: 'Build failure',
          frequencyTrend: [
            { date: new Date('2024-01-08T00:00:00Z'), frequency: 2 },
            { date: new Date('2024-01-15T00:00:00Z'), frequency: 3 },
            { date: new Date('2024-01-22T00:00:00Z'), frequency: 1 },
            { date: new Date('2024-01-29T00:00:00Z'), frequency: 0 }
          ],
          impactTrend: [
            { date: new Date('2024-01-08T00:00:00Z'), impactScore: 45 },
            { date: new Date('2024-01-15T00:00:00Z'), impactScore: 60 },
            { date: new Date('2024-01-22T00:00:00Z'), impactScore: 30 },
            { date: new Date('2024-01-29T00:00:00Z'), impactScore: 0 }
          ],
          resolutionStatusTimeline: [
            { date: new Date('2024-01-08T00:00:00Z'), status: 'unresolved' as const },
            { date: new Date('2024-01-15T00:00:00Z'), status: 'in_progress' as const },
            { date: new Date('2024-01-22T00:00:00Z'), status: 'in_progress' as const },
            { date: new Date('2024-01-29T00:00:00Z'), status: 'resolved' as const }
          ]
        }
      ],
      bottleneckSeverityRanking: [
        {
          issueId: 'issue_1',
          severityRank: 'high' as const,
          severityScore: 75,
          justification: 'Recurring build failures affecting team velocity'
        }
      ],
      improvementTrendAnalysis: [
        {
          issueId: 'issue_1',
          trendDirection: 'improving' as const,
          improvementRate: 0.75,
          daysToResolution: 21
        }
      ]
    };

    const mockBottleneckProgressionResult = {
      progressionPatterns: [
        {
          issueId: 'issue_1',
          progressionType: 'improving' as const,
          weeklyFrequencyTrend: [2, 3, 1, 0],
          category: 'Technical Infrastructure'
        }
      ],
      criticalBottlenecks: [],
      resolvedBottlenecks: [
        {
          issueId: 'issue_1',
          issueContent: 'Build failure',
          resolutionDate: new Date('2024-01-29T00:00:00Z'),
          resolvedWeek: 4
        }
      ],
      emergingBottlenecks: []
    };

    const mockTeamPerformanceMetrics = {
      teamMetrics: [
        {
          teamId: 'team_001',
          issueResolutionSpeedDays: 7,
          reportSubmissionRate: submissionRate,
          issueRecurrenceRate: 15,
          priorityScore: 65,
          performanceRank: 'medium' as const
        }
      ],
      aggregationPeriod: {
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-01-31T23:59:59Z')
      },
      calculationTimestamp: new Date('2024-02-01T10:00:00Z')
    };

    const mockStructuredReportContent = {
      reportPeriod: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      topPriorityChallenges: [
        {
          challengeId: 'issue_1',
          priorityScore: 75,
          impactDegree: 60,
          occurrenceFrequency: 6,
          description: 'Build infrastructure failures',
          recommendedAction: 'Investigate and stabilize CI/CD pipeline'
        }
      ],
      teamPerformanceSummary: {
        totalTeams: 1,
        teamMetrics: [
          {
            teamId: 'team_001',
            issueResolutionSpeedDays: 7,
            reportSubmissionRate: submissionRate,
            issueRecurrenceRate: 15,
            priorityScore: 65,
            performanceRank: 'medium' as const
          }
        ],
        overallMetrics: {
          averageResolutionSpeedDays: 7,
          averageSubmissionRate: submissionRate,
          averageRecurrenceRate: 15
        }
      },
      recommendedCountermeasures: [
        {
          issueId: 'issue_1',
          counterMeasure: 'Implement automated build recovery',
          assignedTo: 'DevOps Lead',
          targetCompletionDate: '2024-02-15',
          estimatedEffort: 'High'
        }
      ],
      projectDelayRiskAssessment: {
        riskScore: 55,
        riskLevel: 'medium',
        affectedProjects: ['Project Alpha']
      }
    };

    const mockResult = {
      reportId: 'report_2024_01_001',
      targetMonth: '2024-01',
      reportContent: mockStructuredReportContent,
      projectDelayRiskLevel: 'medium' as const,
      generatedAt: new Date('2024-02-01T10:00:00Z')
    };

    const mockGenerateMonthlyAnalysisReport = jest.fn();
    mockGenerateMonthlyAnalysisReport.mockResolvedValue(mockResult);

    const result = await generateMonthlyAnalysisReport({
      targetMonth,
      projectManagerId,
      includeExecutiveSummary,
      topChallengesCount
    });

    expect(result).toBeDefined();
    expect(result.reportId).toBe('report_2024_01_001');
    expect(result.targetMonth).toBe('2024-01');
    expect(result.projectDelayRiskLevel).toBe('medium');
    expect(result.generatedAt).toEqual(new Date('2024-02-01T10:00:00Z'));
    
    expect(result.reportContent).toBeDefined();
    expect(result.reportContent.reportPeriod.startDate).toBe('2024-01-01');
    expect(result.reportContent.reportPeriod.endDate).toBe('2024-01-31');
    expect(result.reportContent.topPriorityChallenges).toHaveLength(1);
    expect(result.reportContent.topPriorityChallenges[0].priorityScore).toBe(75);
    
    expect(result.reportContent.teamPerformanceSummary).toBeDefined();
    expect(result.reportContent.teamPerformanceSummary.teamMetrics[0].reportSubmissionRate).toBe(40);
    
    expect(submissionRate).toBeLessThan(50);
    expect(submittedMemberIds.length).toBeLessThan(5);
    expect(teamMemberIds.length).toBe(10);
  });
});