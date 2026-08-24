import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { buildAction07Prompt, ACTION_07_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-07';
import type { Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: Monthly Report Generation to Analysis Completion', () => {
  // SCEN-3187
  test('should execute autonomous action 7 (prioritize analysis results) and return structured prioritized findings', async () => {
    // Setup: Mock AI Client
    const mockAiClient: Tx7Imp1AiClient = {
      callAction01ConfirmTrigger: jest.fn().mockResolvedValue({
        triggerConfirmed: true,
        executionTimestamp: new Date('2024-02-01T09:00:00Z'),
      }),
      callAction02ExtractData: jest.fn().mockResolvedValue({
        extractedRecords: 50,
        dataPoints: [
          {
            date: '2024-01-15',
            yesterday: 'Completed API integration testing',
            today: 'Start database migration',
            challenges: 'Database connection timeout issue',
            memberName: 'Engineer-1',
          },
          {
            date: '2024-01-16',
            yesterday: 'Completed database migration',
            today: 'Deploy to staging',
            challenges: 'Database connection timeout issue persists',
            memberName: 'Engineer-2',
          },
          {
            date: '2024-01-17',
            yesterday: 'Testing on staging complete',
            today: 'Production deployment',
            challenges: 'Performance degradation in API',
            memberName: 'Engineer-3',
          },
          {
            date: '2024-01-18',
            yesterday: 'Production deployment successful',
            today: 'Monitor metrics',
            challenges: 'Database connection timeout issue, Performance degradation in API',
            memberName: 'Engineer-4',
          },
          {
            date: '2024-01-19',
            yesterday: 'Metrics monitoring complete',
            today: 'Incident postmortem',
            challenges: 'Database connection timeout issue',
            memberName: 'Engineer-5',
          },
        ],
      }),
      callAction03GenerateReport: jest.fn().mockResolvedValue({
        reportId: 'REPORT-2024-01-001',
        generatedAt: new Date('2024-02-01T09:15:00Z'),
        reportStatus: 'generated',
      }),
      callAction04AnalyzeTimeSeries: jest.fn().mockResolvedValue({
        timeSeriesData: [
          { date: '2024-01-15', issueCount: 1, severity: 'low' },
          { date: '2024-01-16', issueCount: 2, severity: 'medium' },
          { date: '2024-01-17', issueCount: 2, severity: 'high' },
          { date: '2024-01-18', issueCount: 3, severity: 'high' },
          { date: '2024-01-19', issueCount: 2, severity: 'medium' },
        ],
      }),
      callAction05AnalyzeBottleneck: jest.fn().mockResolvedValue({
        bottleneckIssues: [
          {
            issueId: 'ISSUE-001',
            description: 'Database connection timeout issue',
            occurrences: 3,
            affectedTeamCount: 4,
            impactScore: 85,
            firstReportedDate: '2024-01-15',
            lastReportedDate: '2024-01-19',
            resolutionStatus: 'pending',
          },
          {
            issueId: 'ISSUE-002',
            description: 'Performance degradation in API',
            occurrences: 2,
            affectedTeamCount: 2,
            impactScore: 65,
            firstReportedDate: '2024-01-17',
            lastReportedDate: '2024-01-18',
            resolutionStatus: 'pending',
          },
        ],
      }),
      callAction06CalculateMetrics: jest.fn().mockResolvedValue({
        teamPerformanceMetrics: {
          avgIssueResolutionDays: 3.5,
          reportSubmissionRate: 88,
          issueRecurrenceRate: 42,
          teamCount: 5,
        },
      }),
      callAction07PrioritizeResults: jest.fn().mockResolvedValue({
        prioritizedFindings: [
          {
            priorityLevel: 'high',
            issueId: 'ISSUE-001',
            description: 'Database connection timeout issue',
            affectedTeamCount: 4,
            impactScore: 85,
            recommendation: 'Immediate investigation of database connection pool configuration required. Coordinate with infrastructure team.',
            category: 'ボトルネック推移',
            occurrences: 3,
          },
          {
            priorityLevel: 'high',
            issueId: 'ISSUE-002',
            description: 'Performance degradation in API',
            affectedTeamCount: 2,
            impactScore: 65,
            recommendation: 'Performance profiling and optimization of API endpoints. Consider caching strategy review.',
            category: 'ボトルネック推移',
            occurrences: 2,
          },
          {
            priorityLevel: 'medium',
            issueId: 'METRIC-001',
            description: 'Issue resolution time trend',
            affectedTeamCount: 5,
            impactScore: 58,
            recommendation: 'Monitor and establish baseline for issue resolution SLA targets.',
            category: 'チーム別パフォーマンス',
            occurrences: 1,
          },
          {
            priorityLevel: 'medium',
            issueId: 'METRIC-002',
            description: 'Report submission compliance',
            affectedTeamCount: 5,
            impactScore: 50,
            recommendation: 'Continue monitoring, current rate at 88% is acceptable but aim for 95%.',
            category: 'チーム別パフォーマンス',
            occurrences: 1,
          },
        ],
      }),
      callAction08PresentToManager: jest.fn().mockResolvedValue({
        presentationId: 'PRES-2024-01-001',
        presentedAt: new Date('2024-02-01T09:30:00Z'),
        recipientEmail: 'manager@example.com',
        topFindingsCount: 4,
      }),
    };

    // Setup: Mock TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['Database connection timeout', 'Performance degradation'],
        frequencies: [3, 2],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ score: 75 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' }),
    };

    // Setup: Mock NotificationServiceAdapter
    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    // Setup: Input parameters
    const input = {
      triggerTimestamp: new Date('2024-02-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'MGR-001',
      includeDetailedAnalysis: true,
    };

    // Execute
    const result = await runTx7Imp1Agent(input, mockAiClient);

    // Verify: AI client method call sequence
    expect(mockAiClient.callAction01ConfirmTrigger).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction02ExtractData).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction03GenerateReport).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction04AnalyzeTimeSeries).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction05AnalyzeBottleneck).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction06CalculateMetrics).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction07PrioritizeResults).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction08PresentToManager).toHaveBeenCalledTimes(1);

    // Verify: Action 7 prompt module exports
    expect(typeof buildAction07Prompt).toBe('function');
    expect(ACTION_07_PROMPT_VERSION).toBeDefined();

    // Verify: Result contains analysisReport
    expect(result).toHaveProperty('analysisReport');
    expect(result.analysisReport).toHaveProperty('prioritizedFindings');
    expect(Array.isArray(result.analysisReport.prioritizedFindings)).toBe(true);

    // Verify: Minimum 3 top findings are included
    expect(result.analysisReport.prioritizedFindings.length).toBeGreaterThanOrEqual(3);

    // Verify: All findings have required structure
    result.analysisReport.prioritizedFindings.forEach((finding) => {
      expect(finding).toHaveProperty('priorityLevel');
      expect(['high', 'medium', 'low']).toContain(finding.priorityLevel);
      expect(finding).toHaveProperty('issueId');
      expect(typeof finding.issueId).toBe('string');
      expect(finding).toHaveProperty('affectedTeamCount');
      expect(typeof finding.affectedTeamCount).toBe('number');
      expect(finding.affectedTeamCount).toBeGreaterThan(0);
      expect(finding).toHaveProperty('impactScore');
      expect(typeof finding.impactScore).toBe('number');
      expect(finding.impactScore).toBeGreaterThanOrEqual(0);
      expect(finding.impactScore).toBeLessThanOrEqual(100);
      expect(finding).toHaveProperty('recommendation');
      expect(typeof finding.recommendation).toBe('string');
      expect(finding.recommendation.length).toBeGreaterThan(0);
      expect(finding).toHaveProperty('category');
      expect(['課題の時系列変化', 'ボトルネック推移', 'チーム別パフォーマンス']).toContain(finding.category);
    });

    // Verify: Findings are sorted by priorityLevel and impactScore in descending order
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    for (let i = 0; i < result.analysisReport.prioritizedFindings.length - 1; i++) {
      const current = result.analysisReport.prioritizedFindings[i];
      const next = result.analysisReport.prioritizedFindings[i + 1];
      const currentPriorityValue = priorityOrder[current.priorityLevel];
      const nextPriorityValue = priorityOrder[next.priorityLevel];

      if (currentPriorityValue === nextPriorityValue) {
        expect(current.impactScore).toBeGreaterThanOrEqual(next.impactScore);
      } else {
        expect(currentPriorityValue).toBeGreaterThanOrEqual(nextPriorityValue);
      }
    }

    // Verify: High priority findings are present
    const highPriorityFindings = result.analysisReport.prioritizedFindings.filter(
      (f) => f.priorityLevel === 'high'
    );
    expect(highPriorityFindings.length).toBeGreaterThan(0);

    // Verify: First high priority finding has expected values
    expect(highPriorityFindings[0].impactScore).toBe(85);
    expect(highPriorityFindings[0].issueId).toBe('ISSUE-001');
    expect(highPriorityFindings[0].affectedTeamCount).toBe(4);

    // Verify: Result contains execution status
    expect(result).toHaveProperty('executionStatus');
    expect(['success', 'partial_failure', 'failure']).toContain(result.executionStatus);

    // Verify: Result contains reportId
    expect(result).toHaveProperty('reportId');
    expect(typeof result.reportId).toBe('string');

    // Verify: Result contains deliveryTimestamp
    expect(result).toHaveProperty('deliveryTimestamp');
    expect(result.deliveryTimestamp instanceof Date).toBe(true);

    // Verify: Mock AI client was not called with real API credentials
    expect(mockAiClient.callAction07PrioritizeResults).toHaveBeenCalledWith(
      expect.objectContaining({
        bottleneckIssues: expect.any(Array),
        teamPerformanceMetrics: expect.any(Object),
      })
    );
  });
});