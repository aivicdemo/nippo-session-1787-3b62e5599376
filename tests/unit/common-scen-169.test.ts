import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('tx-9-imp-1 orchestrator', () => {
  let mockAiClient: jest.Mocked<Tx9Imp1AiClient>;
  let mockAuditLog: jest.Mock;
  let mockDatabase: jest.Mock;
  let mockEmailService: jest.Mock;

  beforeEach(() => {
    mockAiClient = {
      action01_aggregateReportData: jest.fn(),
      action02_quantifyProductivityMetrics: jest.fn(),
      action03_classifyIssuesByPriority: jest.fn(),
      action04_detectRecurrencePatterns: jest.fn(),
      action05_proposeCountermeasures: jest.fn(),
      action06_validateAndEscalate: jest.fn(),
      action07_presentAnalysisReport: jest.fn(),
    } as any;

    mockAuditLog = jest.fn();
    mockDatabase = jest.fn();
    mockEmailService = jest.fn();

    global.auditLog = mockAuditLog;
    global.database = mockDatabase;
    global.emailService = mockEmailService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-169
  it('should escalate with hand-off context when proposed countermeasures require executive judgment', async () => {
    const aggregationStartDate = '2024-01-08';
    const aggregationEndDate = '2024-01-14';
    const targetTeamIds = ['team-001', 'team-002'];
    const requestedByUserId = 'user-director-001';

    const aggregatedReportData = {
      totalReportsSubmitted: 18,
      totalReportsExpected: 20,
      submissionRate: 0.9,
      reportDetails: [
        {
          reportId: 'report-001',
          teamId: 'team-001',
          submittedAt: '2024-01-08T09:00:00Z',
          issues: ['Issue-A', 'Issue-B'],
        },
        {
          reportId: 'report-002',
          teamId: 'team-002',
          submittedAt: '2024-01-09T08:30:00Z',
          issues: ['Issue-C'],
        },
      ],
    };

    const productivityMetrics = {
      issueResolutionSpeed: 3.5,
      reportSubmissionRate: 90,
      issueRecurrenceRate: 18,
    };

    const classifiedIssues = [
      {
        issueId: 'issue-priority-001',
        priority: 'HIGH',
        description: 'System downtime affecting production',
        resolutionDaysAverage: 2,
      },
      {
        issueId: 'issue-priority-002',
        priority: 'MEDIUM',
        description: 'Code review process delay',
        resolutionDaysAverage: 5,
      },
    ];

    const recurrencePatterns = [
      {
        patternId: 'pattern-001',
        issueType: 'Database connection timeout',
        occurrences: 3,
        lastOccurrenceDate: '2024-01-12',
        rootCauseHypothesis: 'Connection pool exhaustion',
      },
    ];

    const proposedCountermeasures = [
      {
        measureId: 'measure-001',
        title: 'Implement new monitoring tool',
        description: 'Deploy advanced APM solution for real-time visibility',
        estimatedCost: 500000,
        requiresExecutiveJudgment: true,
        executiveJudgmentReason: 'Monthly cost increase of 500,000 yen requires budget approval from CFO',
        expectedImpact: {
          issueResolutionSpeedImprovement: 1.2,
          issueRecurrenceRateReduction: 0.08,
        },
      },
      {
        measureId: 'measure-002',
        title: 'Cross-team coordination protocol',
        description: 'Establish weekly sync meetings between teams',
        requiresExecutiveJudgment: true,
        executiveJudgmentReason: 'Organizational restructuring and resource reallocation required',
        expectedImpact: {
          issueResolutionSpeedImprovement: 0.8,
          issueRecurrenceRateReduction: 0.05,
        },
      },
    ];

    mockAiClient.action01_aggregateReportData.mockResolvedValue(aggregatedReportData);
    mockAiClient.action02_quantifyProductivityMetrics.mockResolvedValue(productivityMetrics);
    mockAiClient.action03_classifyIssuesByPriority.mockResolvedValue(classifiedIssues);
    mockAiClient.action04_detectRecurrencePatterns.mockResolvedValue(recurrencePatterns);
    mockAiClient.action05_proposeCountermeasures.mockResolvedValue(proposedCountermeasures);

    mockAiClient.action06_validateAndEscalate.mockResolvedValue({
      escalationDetected: true,
      escalationCondition: 'proposed_countermeasures_require_executive_judgment',
      escalationReason: 'Measures require executive judgment: budget approval and organizational restructuring',
      handOffContext: {
        intermediateResults: {
          aggregatedData: aggregatedReportData,
          productivityMetrics: productivityMetrics,
          classifiedIssues: classifiedIssues,
          recurrencePatterns: recurrencePatterns,
        },
        proposedCountermeasures: proposedCountermeasures,
        executiveJudgmentRequiredItems: [
          {
            item: 'Budget approval for monitoring tool',
            reason: 'Monthly cost increase of 500,000 yen',
            decisionMaker: 'CFO',
          },
          {
            item: 'Organizational restructuring approval',
            reason: 'Cross-team coordination requires resource reallocation',
            decisionMaker: 'Executive committee',
          },
        ],
        escalationTimestamp: '2024-01-15T11:30:00Z',
        escalationToUserId: requestedByUserId,
        status: 'AWAITING_EXECUTIVE_CONFIRMATION',
      },
    });

    const request = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      requestedByUserId,
    };

    mockDatabase.mockImplementation((operation) => {
      if (operation.type === 'saveAnalysisReport') {
        return Promise.reject(new Error('Database operation should not be executed during escalation'));
      }
      return Promise.resolve();
    });

    mockEmailService.mockImplementation((operation) => {
      if (operation.type === 'sendNotification') {
        return Promise.reject(new Error('Email service should not be executed during escalation'));
      }
      return Promise.resolve();
    });

    const result = await runTx9Imp1Agent(request, mockAiClient);

    expect(mockAiClient.action01_aggregateReportData).toHaveBeenCalledWith({
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
    });

    expect(mockAiClient.action02_quantifyProductivityMetrics).toHaveBeenCalledWith(aggregatedReportData);

    expect(mockAiClient.action03_classifyIssuesByPriority).toHaveBeenCalled();

    expect(mockAiClient.action04_detectRecurrencePatterns).toHaveBeenCalled();

    expect(mockAiClient.action05_proposeCountermeasures).toHaveBeenCalled();

    expect(mockAiClient.action06_validateAndEscalate).toHaveBeenCalled();

    expect(result.escalationDetected).toBe(true);
    expect(result.escalationCondition).toBe('proposed_countermeasures_require_executive_judgment');

    expect(result.handOffContext).toBeDefined();
    expect(result.handOffContext.intermediateResults.aggregatedData.totalReportsSubmitted).toBe(18);
    expect(result.handOffContext.intermediateResults.productivityMetrics.issueResolutionSpeed).toBe(3.5);
    expect(result.handOffContext.intermediateResults.classifiedIssues).toHaveLength(2);
    expect(result.handOffContext.intermediateResults.recurrencePatterns).toHaveLength(1);

    expect(result.handOffContext.proposedCountermeasures).toHaveLength(2);
    expect(result.handOffContext.proposedCountermeasures[0].requiresExecutiveJudgment).toBe(true);
    expect(result.handOffContext.proposedCountermeasures[0].estimatedCost).toBe(500000);

    expect(result.handOffContext.executiveJudgmentRequiredItems).toHaveLength(2);
    expect(result.handOffContext.executiveJudgmentRequiredItems[0].item).toBe('Budget approval for monitoring tool');
    expect(result.handOffContext.executiveJudgmentRequiredItems[0].decisionMaker).toBe('CFO');

    expect(result.handOffContext.escalationTimestamp).toBe('2024-01-15T11:30:00Z');
    expect(result.handOffContext.escalationToUserId).toBe(requestedByUserId);
    expect(result.handOffContext.status).toBe('AWAITING_EXECUTIVE_CONFIRMATION');

    expect(mockAiClient.action07_presentAnalysisReport).not.toHaveBeenCalled();

    expect(mockDatabase).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'saveAnalysisReport' }));
    expect(mockEmailService).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'sendNotification' }));

    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ESCALATION_DETECTED',
        escalationCondition: 'proposed_countermeasures_require_executive_judgment',
        timestamp: '2024-01-15T11:30:00Z',
        escalationToUserId: requestedByUserId,
        intermediateResultsSnapshot: expect.any(Object),
      })
    );
  });
});