import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('Tx9Imp1Agent - Escalation for Complex Multi-Department Issues', () => {
  // SCEN-3224
  test('should escalate to human when AI detects complex issue requiring business judgment across departments', async () => {
    const aggregationStartDate = '2024-01-15';
    const aggregationEndDate = '2024-01-19';
    const targetTeamIds = ['team-001', 'team-002'];
    const requestedByUserId = 'manager-001';

    const mockAiClient: Tx9Imp1AiClient = {
      action01_collectReportingData: jest.fn(async () => ({
        collectedReports: [
          {
            memberId: 'eng-001',
            date: '2024-01-15',
            yesterday: 'Implemented auth module',
            today: 'Code review pending',
            issues: 'Database connection pooling needs optimization across both web and API services',
          },
          {
            memberId: 'eng-002',
            date: '2024-01-15',
            yesterday: 'Fixed UI responsive issues',
            today: 'Deploy to staging',
            issues: 'Database connection pooling needs optimization - affecting frontend performance',
          },
          {
            memberId: 'sales-001',
            date: '2024-01-15',
            yesterday: 'Customer meetings',
            today: 'Prepare proposals',
            issues: 'Database connection pooling impacting customer data retrieval speed',
          },
        ],
        unsubmittedMembers: ['eng-003'],
        collectionTimestamp: '2024-01-15T10:30:00Z',
      })),

      action02_sendReminderNotifications: jest.fn(async () => ({
        sentTo: ['eng-003'],
        failedTo: [],
        timestamp: '2024-01-15T10:35:00Z',
      })),

      action03_quantifyProductivityMetrics: jest.fn(async () => ({
        issueFrequencyPerDay: 2.4,
        averageResolutionDays: 3.5,
        completionRate: 78.5,
        metricsComputedAt: '2024-01-15T10:40:00Z',
      })),

      action04_classifyIssuesByPriority: jest.fn(async () => ({
        highPriorityIssues: [
          {
            issueId: 'issue-001',
            description: 'Database connection pooling optimization',
            frequency: 3,
            affectedDepartments: ['engineering', 'sales'],
            impactScore: 85,
            priorityRank: 1,
          },
        ],
        mediumPriorityIssues: [],
        lowPriorityIssues: [],
        classificationTimestamp: '2024-01-15T10:45:00Z',
      })),

      action05_detectRecurrencePatterns: jest.fn(async () => ({
        identifiedPatterns: [
          {
            patternId: 'pattern-db-001',
            issueDescription: 'Database connection pooling',
            lastOccurrenceDate: '2024-01-10',
            occurrenceCount: 5,
            trend: 'increasing',
          },
        ],
        patternAnalysisTimestamp: '2024-01-15T10:50:00Z',
      })),

      action06_proposeCorrectionMeasures: jest.fn(async () => ({
        escalationDetected: true,
        escalationReason: 'Complex multi-department issue requiring business judgment',
        escalationReasons: [
          '複数部門波及',
          '経営判断要',
        ],
        proposedMeasures: [
          {
            measureId: 'measure-db-001',
            description: 'Implement connection pool with auto-scaling',
            estimatedEffort: 'high',
            estimatedTimeline: '2 weeks',
            riskLevel: 'medium',
          },
          {
            measureId: 'measure-db-002',
            description: 'Migrate to managed database service',
            estimatedEffort: 'very_high',
            estimatedTimeline: '4 weeks',
            riskLevel: 'high',
            businessImpact: 'May require budget approval and vendor negotiation',
          },
        ],
        confidence: 0.55,
        partialAnalysisResults: {
          metricsComputed: true,
          priorityClassificationDone: true,
          recurrencePatternsIdentified: true,
          awaitsBusinessJudgment: true,
        },
        proposalTimestamp: '2024-01-15T10:55:00Z',
      })),

      action07_generateAndDeliverReport: jest.fn(async () => {
        throw new Error('ESCALATION_PENDING: Action 7 should not execute when escalation is detected');
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string) => ({
        delivered: true,
        status: 'delivered',
      })),
    };

    const mockAuditLogger = {
      logEscalationEvent: jest.fn((eventData: {
        escalationCondition: string;
        timestamp: string;
        handoffReason: string;
        partialResults: Record<string, unknown>;
      }) => {
        // Audit log capture
      }),
    };

    const analysisResult = await runTx9Imp1Agent(
      {
        aggregationPeriodStart: new Date(`${aggregationStartDate}T00:00:00Z`),
        aggregationPeriodEnd: new Date(`${aggregationEndDate}T23:59:59Z`),
        targetTeamIds,
        managerUserId: requestedByUserId,
      },
      mockAiClient,
      {
        notificationService: mockNotificationAdapter,
        auditLogger: mockAuditLogger,
      },
    );

    // Verify Action 1 was called
    expect(mockAiClient.action01_collectReportingData).toHaveBeenCalledWith({
      aggregationPeriodStart: new Date(`${aggregationStartDate}T00:00:00Z`),
      aggregationPeriodEnd: new Date(`${aggregationEndDate}T23:59:59Z`),
      targetTeamIds,
    });

    // Verify Action 2 was called
    expect(mockAiClient.action02_sendReminderNotifications).toHaveBeenCalled();

    // Verify Action 3 was called
    expect(mockAiClient.action03_quantifyProductivityMetrics).toHaveBeenCalled();

    // Verify Action 4 was called
    expect(mockAiClient.action04_classifyIssuesByPriority).toHaveBeenCalled();

    // Verify Action 5 was called
    expect(mockAiClient.action05_detectRecurrencePatterns).toHaveBeenCalled();

    // Verify Action 6 was called
    expect(mockAiClient.action06_proposeCorrectionMeasures).toHaveBeenCalled();

    // Verify Action 7 was NOT called (escalation prevented it)
    expect(mockAiClient.action07_generateAndDeliverReport).not.toHaveBeenCalled();

    // Verify escalation status
    expect(analysisResult.reportDeliveryStatus).toBe('escalation_pending');

    // Verify escalation reason is captured
    expect(analysisResult.escalationMetadata).toBeDefined();
    expect(analysisResult.escalationMetadata?.reason).toContain('複合的課題');

    // Verify confidence score indicates low confidence
    expect(analysisResult.escalationMetadata?.aiConfidenceScore).toBeLessThanOrEqual(0.6);

    // Verify partial analysis results are included for human review
    expect(analysisResult.escalationMetadata?.partialAnalysisResults).toBeDefined();
    expect(analysisResult.escalationMetadata?.partialAnalysisResults?.metricsComputed).toBe(true);
    expect(analysisResult.escalationMetadata?.partialAnalysisResults?.priorityClassificationDone).toBe(true);
    expect(analysisResult.escalationMetadata?.partialAnalysisResults?.recurrencePatternsIdentified).toBe(true);

    // Verify escalation notification was sent to manager
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith(
      requestedByUserId,
      expect.stringContaining('エスカレーション'),
    );

    // Verify audit log records escalation event
    expect(mockAuditLogger.logEscalationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        escalationCondition: expect.stringContaining('複合的課題'),
        timestamp: expect.any(String),
        handoffReason: expect.stringContaining('経営判断'),
      }),
    );

    // Verify no final report was generated
    expect(analysisResult.analysisReportId).toBeNull();

    // Verify affected departments are documented for human review
    expect(analysisResult.escalationMetadata?.affectedDepartments).toContain('engineering');
    expect(analysisResult.escalationMetadata?.affectedDepartments).toContain('sales');

    // Verify business judgment factors are documented
    expect(analysisResult.escalationMetadata?.businessJudgmentFactors).toBeDefined();
    expect(analysisResult.escalationMetadata?.businessJudgmentFactors?.length).toBeGreaterThan(0);
  });
});