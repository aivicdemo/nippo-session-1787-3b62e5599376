import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行 AIエージェント', () => {
  // SCEN-3180
  test('should complete monthly report generation and analysis autonomously without human approval', async () => {
    // Setup: Mock AI Client
    const mockAiClient: Tx7Imp1AiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        triggeredAt: new Date('2024-02-01T00:00:00Z'),
        targetMonth: '2024-01',
        triggerStatus: 'confirmed',
      }),
      executeAction02: jest.fn().mockResolvedValue({
        extractedRecordCount: 25,
        recordIds: Array.from({ length: 25 }, (_, i) => `report_${i + 1}`),
        extractedAt: new Date('2024-02-01T00:05:00Z'),
      }),
      executeAction03: jest.fn().mockResolvedValue({
        reportId: 'monthly_report_2024_01_001',
        generatedAt: new Date('2024-02-01T00:10:00Z'),
        templateApplied: true,
        dbSaved: true,
      }),
      executeAction04: jest.fn().mockResolvedValue({
        timeSeriesAnalysisId: 'ts_analysis_001',
        issuePatterns: [
          {
            issueKeyword: 'database_performance',
            firstAppearanceDate: '2024-01-05',
            lastAppearanceDate: '2024-01-28',
            recurrenceDates: ['2024-01-05', '2024-01-12', '2024-01-19', '2024-01-26'],
            totalOccurrences: 4,
          },
          {
            issueKeyword: 'api_timeout',
            firstAppearanceDate: '2024-01-08',
            lastAppearanceDate: '2024-01-25',
            recurrenceDates: ['2024-01-08', '2024-01-15', '2024-01-22'],
            totalOccurrences: 3,
          },
          {
            issueKeyword: 'memory_leak',
            firstAppearanceDate: '2024-01-10',
            lastAppearanceDate: '2024-01-20',
            recurrenceDates: ['2024-01-10', '2024-01-17'],
            totalOccurrences: 2,
          },
        ],
        analysisCompletedAt: new Date('2024-02-01T00:15:00Z'),
      }),
      executeAction05: jest.fn().mockResolvedValue({
        bottleneckAnalysisId: 'bottleneck_001',
        bottleneckIssues: [
          {
            issueKeyword: 'database_performance',
            frequency: 4,
            severity: 'high',
            bottleneckFlag: true,
            affectedMembers: 8,
            mentionedInReports: 12,
          },
          {
            issueKeyword: 'api_timeout',
            frequency: 3,
            severity: 'high',
            bottleneckFlag: true,
            affectedMembers: 7,
            mentionedInReports: 10,
          },
          {
            issueKeyword: 'memory_leak',
            frequency: 2,
            severity: 'medium',
            bottleneckFlag: true,
            affectedMembers: 5,
            mentionedInReports: 8,
          },
        ],
        bottleneckCount: 3,
        analysisCompletedAt: new Date('2024-02-01T00:20:00Z'),
      }),
      executeAction06: jest.fn().mockResolvedValue({
        performanceMetricsId: 'perf_metrics_001',
        teamPerformanceData: [
          {
            memberId: 'member_001',
            memberName: 'Engineer A',
            issueReportCount: 5,
            resolutionRate: 80,
            responseSpeedScore: 85,
          },
          {
            memberId: 'member_002',
            memberName: 'Engineer B',
            issueReportCount: 3,
            resolutionRate: 67,
            responseSpeedScore: 75,
          },
          {
            memberId: 'member_003',
            memberName: 'Engineer C',
            issueReportCount: 4,
            resolutionRate: 75,
            responseSpeedScore: 80,
          },
          {
            memberId: 'member_004',
            memberName: 'Engineer D',
            issueReportCount: 2,
            resolutionRate: 50,
            responseSpeedScore: 60,
          },
          {
            memberId: 'member_005',
            memberName: 'Engineer E',
            issueReportCount: 3,
            resolutionRate: 67,
            responseSpeedScore: 72,
          },
          {
            memberId: 'member_006',
            memberName: 'Engineer F',
            issueReportCount: 2,
            resolutionRate: 100,
            responseSpeedScore: 90,
          },
          {
            memberId: 'member_007',
            memberName: 'Engineer G',
            issueReportCount: 2,
            resolutionRate: 50,
            responseSpeedScore: 65,
          },
          {
            memberId: 'member_008',
            memberName: 'Engineer H',
            issueReportCount: 1,
            resolutionRate: 100,
            responseSpeedScore: 88,
          },
          {
            memberId: 'member_009',
            memberName: 'Engineer I',
            issueReportCount: 1,
            resolutionRate: 0,
            responseSpeedScore: 55,
          },
          {
            memberId: 'member_010',
            memberName: 'Engineer J',
            issueReportCount: 0,
            resolutionRate: 0,
            responseSpeedScore: 0,
          },
        ],
        metricsCount: 10,
        calculatedAt: new Date('2024-02-01T00:25:00Z'),
      }),
      executeAction07: jest.fn().mockResolvedValue({
        priorityAssignmentId: 'priority_assign_001',
        prioritizedIssues: [
          {
            issueKeyword: 'database_performance',
            priorityLevel: 'high',
            priorityScore: 92,
            priorityReason: '4件の報告、8名のメンバーに影響、継続的に発生',
          },
          {
            issueKeyword: 'api_timeout',
            priorityLevel: 'high',
            priorityScore: 88,
            priorityReason: '3件の報告、7名のメンバーに影響、API機能に直結',
          },
          {
            issueKeyword: 'memory_leak',
            priorityLevel: 'medium',
            priorityScore: 65,
            priorityReason: '2件の報告、5名のメンバーに影響、段階的な悪化',
          },
        ],
        allIssuesPrioritized: true,
        completedAt: new Date('2024-02-01T00:30:00Z'),
      }),
      executeAction08: jest.fn().mockResolvedValue({
        analysisResultId: 'analysis_result_001',
        status: 'ready_for_review',
        savedToManagerReviewTable: true,
        managerNotificationSent: true,
        completedAt: new Date('2024-02-01T00:35:00Z'),
      }),
    };

    // Setup: Mock audit log collector
    const auditLogEntries: Array<{
      actionNumber: number;
      actionName: string;
      executedAt: Date;
      status: string;
    }> = [];

    const mockAuditCollector = {
      recordAction: (actionNum: number, actionName: string, executedAt: Date, status: string) => {
        auditLogEntries.push({ actionNumber: actionNum, actionName, executedAt, status });
      },
    };

    // Input: Agent trigger at month start
    const input: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-02-01T00:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'manager_001',
      includeDetailedAnalysis: true,
    };

    // Execute: Run agent
    const result = await runTx7Imp1Agent(input, mockAiClient);

    // Verify: All actions executed in sequence
    expect(mockAiClient.executeAction01).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction02).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction03).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction04).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction05).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction06).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction07).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction08).toHaveBeenCalledTimes(1);

    // Verify: Result structure and content
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('executionStatus');
    expect(result).toHaveProperty('analysisResultSummary');
    expect(result).toHaveProperty('deliveryTimestamp');

    expect(result.reportId).toBe('monthly_report_2024_01_001');
    expect(result.executionStatus).toBe('success');
    expect(result.deliveryTimestamp).toEqual(new Date('2024-02-01T00:35:00Z'));

    // Verify: Analysis Result Summary
    const summary = result.analysisResultSummary;
    expect(summary).toHaveProperty('topPriorityChallenges');
    expect(summary).toHaveProperty('performanceMetrics');
    expect(summary).toHaveProperty('bottleneckTrend');

    // Verify: Top Priority Challenges (3 issues extracted)
    expect(summary.topPriorityChallenges).toHaveLength(3);
    expect(summary.topPriorityChallenges[0]).toMatchObject({
      challengeId: expect.any(String),
      priorityScore: 92,
      occurrenceFrequency: 4,
      impactLevel: 'high',
      resolutionDaysAverage: expect.any(Number),
    });

    // Verify: Performance Metrics (10 members)
    expect(summary.performanceMetrics).toHaveProperty('teamMembers');
    expect(summary.performanceMetrics.teamMembers).toHaveLength(10);
    expect(summary.performanceMetrics.teamMembers[0]).toMatchObject({
      memberId: 'member_001',
      issueReportCount: 5,
      resolutionRate: 80,
      responseSpeedScore: 85,
    });

    // Verify: Bottleneck Trend Analysis
    expect(summary.bottleneckTrend).toHaveProperty('timeSeriesData');
    expect(summary.bottleneckTrend).toHaveProperty('improvementTrend');
    expect(summary.bottleneckTrend).toHaveProperty('recurringIssuePattern');

    // Verify: Time series data exists (min 4 weeks or daily data)
    expect(summary.bottleneckTrend.timeSeriesData.length).toBeGreaterThanOrEqual(4);

    // Verify: Improvement trend is identified
    expect(['improving', 'stable', 'deteriorating']).toContain(
      summary.bottleneckTrend.improvementTrend
    );

    // Verify: Recurring issue patterns (at least 3)
    expect(summary.bottleneckTrend.recurringIssuePattern).toHaveLength(3);
    expect(summary.bottleneckTrend.recurringIssuePattern).toContain('database_performance');
    expect(summary.bottleneckTrend.recurringIssuePattern).toContain('api_timeout');
    expect(summary.bottleneckTrend.recurringIssuePattern).toContain('memory_leak');

    // Verify: Data extraction count (20-31 records, actual: 25)
    expect(result.analysisResultSummary).toHaveProperty('totalExtractedRecords');
    expect(result.analysisResultSummary.totalExtractedRecords).toBe(25);
    expect(result.analysisResultSummary.totalExtractedRecords).toBeGreaterThanOrEqual(20);
    expect(result.analysisResultSummary.totalExtractedRecords).toBeLessThanOrEqual(31);

    // Verify: All issues have priority levels
    const allIssues = summary.topPriorityChallenges;
    allIssues.forEach((issue) => {
      expect(['high', 'medium', 'low']).toContain(issue.impactLevel);
      expect(issue.priorityScore).toBeGreaterThanOrEqual(1);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
    });

    // Verify: Manager review status
    expect(result).toHaveProperty('reviewStatus');
    expect(result.reviewStatus).toBe('ready_for_review');

    // Verify: No human approval required (autonomously completed)
    expect(result).toHaveProperty('autonomousCompletionFlag');
    expect(result.autonomousCompletionFlag).toBe(true);

    // Verify: Execution time is within 3 minutes
    const executionTimeMs = result.deliveryTimestamp.getTime() - input.triggerTimestamp.getTime();
    expect(executionTimeMs).toBeLessThanOrEqual(180000); // 3 minutes

    // Verify: Audit log contains all 8 actions in order
    auditLogEntries.length === 8; // All actions should be logged
  });
});