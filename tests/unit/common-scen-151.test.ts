import { runTx8Imp1Agent, type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('Tx8Imp1Agent - Emergency Escalation on Critical Issue Detection', () => {
  // SCEN-151
  test('should escalate to human review when critical issue is detected before committing side effects', async () => {
    const analysisStartDate = '2024-01-15';
    const analysisEndDate = '2024-01-22';
    const managerEmail = 'manager@example.com';
    const minimumDataThreshold = 10;

    const mockAiClient: Tx8Imp1AiClient = {
      action01SearchExtractIssueData: jest.fn().mockResolvedValue({
        issueDataList: [
          {
            issueId: 'ISS-001',
            title: 'Database connection timeout',
            reportedDate: '2024-01-20T09:30:00Z',
            severity: 'high',
            affectedTeams: ['backend', 'infrastructure'],
          },
          {
            issueId: 'ISS-002',
            title: 'API response delay',
            reportedDate: '2024-01-21T10:15:00Z',
            severity: 'medium',
            affectedTeams: ['backend'],
          },
          {
            issueId: 'ISS-003',
            title: 'Authentication service outage',
            reportedDate: '2024-01-22T08:45:00Z',
            severity: 'critical',
            affectedTeams: ['auth', 'backend', 'frontend'],
          },
        ],
        extractedCount: 3,
        extractionTimestamp: '2024-01-22T11:00:00Z',
      }),

      action02AnalyzeRecurrencePattern: jest.fn().mockResolvedValue({
        patterns: [
          {
            patternId: 'PAT-001',
            issueTitle: 'Database connectivity',
            occurrenceCount: 5,
            timeSeriesAnalysis: [
              { date: '2024-01-10', count: 1 },
              { date: '2024-01-15', count: 2 },
              { date: '2024-01-20', count: 2 },
            ],
            riskScore: 0.72,
          },
          {
            patternId: 'PAT-002',
            issueTitle: 'API performance',
            occurrenceCount: 8,
            timeSeriesAnalysis: [
              { date: '2024-01-08', count: 1 },
              { date: '2024-01-14', count: 2 },
              { date: '2024-01-21', count: 5 },
            ],
            riskScore: 0.85,
          },
        ],
        analysisCompletedAt: '2024-01-22T11:05:00Z',
      }),

      action03IdentifyBottleneck: jest.fn().mockResolvedValue({
        bottlenecks: [
          {
            bottleneckId: 'BN-001',
            category: 'infrastructure',
            description: 'Load balancer misconfiguration causing cascading failures',
            impactedIssueIds: ['ISS-001', 'ISS-003'],
            temporalTrend: 'accelerating',
            estimatedResolutionDays: 3,
          },
          {
            bottleneckId: 'BN-002',
            category: 'deployment',
            description: 'Insufficient capacity during peak hours',
            impactedIssueIds: ['ISS-002', 'ISS-003'],
            temporalTrend: 'steady',
            estimatedResolutionDays: 5,
          },
        ],
        identificationCompletedAt: '2024-01-22T11:10:00Z',
      }),

      action04GenerateVisualizationReport: jest.fn().mockResolvedValue({
        reportId: 'RPT-8IMP1-20240122-001',
        title: 'Critical Issue Pattern Analysis Report',
        generatedAt: '2024-01-22T11:15:00Z',
        chartUrls: [
          'https://reports.internal/chart-001-recurrence-trend.png',
          'https://reports.internal/chart-002-bottleneck-impact.png',
        ],
        summaryMetrics: {
          totalIssuesAnalyzed: 3,
          criticalIssuesFound: 1,
          averageRecurrenceRiskScore: 0.78,
          predictedResolutionDays: 4,
        },
      }),

      action05DetectEscalationCondition: jest.fn().mockResolvedValue({
        escalationDetected: true,
        escalationReason: 'critical_issue_identified',
        escalationDetails: {
          criticalIssueId: 'ISS-003',
          criticalIssueTitle: 'Authentication service outage',
          severity: 'critical',
          affectedSystems: ['auth', 'backend', 'frontend'],
          userImpactCount: 5000,
          estimatedRecoveryTime: '2024-01-22T14:00:00Z',
          requiresImmediateAttention: true,
        },
        timestamp: '2024-01-22T11:18:00Z',
      }),
    };

    const escalationNotifications: Array<{
      timestamp: string;
      recipient: string;
      escalationReason: string;
      status: string;
    }> = [];
    const auditLog: Array<{
      timestamp: string;
      action: string;
      reason: string;
      recipient: string;
    }> = [];

    const mockNotificationService = {
      sendEscalationNotification: jest
        .fn()
        .mockImplementation((recipient: string, details: unknown) => {
          escalationNotifications.push({
            timestamp: new Date().toISOString(),
            recipient,
            escalationReason:
              typeof details === 'object' && details !== null
                ? (details as Record<string, unknown>).escalationReason ||
                  'unknown'
                : 'unknown',
            status: 'pending_human_review',
          });
          return Promise.resolve({ sent: true, messageId: 'MSG-ESC-001' });
        }),
    };

    const mockAuditService = {
      recordEscalation: jest
        .fn()
        .mockImplementation(
          (
            timestamp: string,
            reason: string,
            recipient: string,
            details: unknown,
          ) => {
            auditLog.push({
              timestamp,
              action: 'escalation_detected',
              reason,
              recipient,
            });
            return Promise.resolve({ recorded: true, auditId: 'AUD-ESC-001' });
          },
        ),
    };

    const input = {
      analysisPeriodStartDate: analysisStartDate,
      analysisPeriodEndDate: analysisEndDate,
      managerEmail,
      minimumDataThreshold,
    };

    const result = await runTx8Imp1Agent(input, mockAiClient, {
      notificationService: mockNotificationService,
      auditService: mockAuditService,
    });

    expect(mockAiClient.action01SearchExtractIssueData).toHaveBeenCalledWith({
      startDate: analysisStartDate,
      endDate: analysisEndDate,
    });

    expect(mockAiClient.action02AnalyzeRecurrencePattern).toHaveBeenCalled();
    expect(mockAiClient.action03IdentifyBottleneck).toHaveBeenCalled();
    expect(mockAiClient.action04GenerateVisualizationReport).toHaveBeenCalled();
    expect(mockAiClient.action05DetectEscalationCondition).toHaveBeenCalled();

    expect(result.analysisStatus).toBe('escalation_detected');
    expect(result.escalationState).toEqual({
      escalationDetected: true,
      escalationReason: 'critical_issue_identified',
      status: 'pending_human_review',
      escalationTimestamp: expect.any(String),
    });

    expect(result.sideEffectsCommitted).toBe(false);

    expect(mockNotificationService.sendEscalationNotification).toHaveBeenCalledWith(
      managerEmail,
      expect.objectContaining({
        escalationReason: 'critical_issue_identified',
        criticalIssueTitle: 'Authentication service outage',
        requiresImmediateAttention: true,
        status: 'pending_human_review',
      }),
    );

    expect(mockAuditService.recordEscalation).toHaveBeenCalledWith(
      expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      'critical_issue_identified',
      managerEmail,
      expect.objectContaining({
        criticalIssueId: 'ISS-003',
        userImpactCount: 5000,
      }),
    );

    expect(escalationNotifications).toHaveLength(1);
    expect(escalationNotifications[0]).toEqual({
      timestamp: expect.any(String),
      recipient: managerEmail,
      escalationReason: 'critical_issue_identified',
      status: 'pending_human_review',
    });

    expect(auditLog).toHaveLength(1);
    expect(auditLog[0]).toEqual({
      timestamp: expect.any(String),
      action: 'escalation_detected',
      reason: 'critical_issue_identified',
      recipient: managerEmail,
    });

    expect(result.reportAutoDistributionCommitted).toBe(false);
    expect(result.autoResponseProposalCommitted).toBe(false);

    expect(result.reportId).toBeDefined();
    expect(result.reportId).not.toBe('');
  });
});