import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 orchestrator', () => {
  let mockAiClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-097
  test('should escalate to human when extracted issue matches multiple categories before confirming side effects', async () => {
    const extractedIssueId = 'ISSUE-001';
    const extractedIssueData = [
      {
        issueId: extractedIssueId,
        title: 'API timeout in production',
        description: 'Customer-facing API experiencing timeout errors',
        extractedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
      },
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.example.com',
      credentials: { token: 'test-token' },
    };

    const priorityRules = {
      highImpactWeight: 0.4,
      highFrequencyWeight: 0.3,
      urgencyWeight: 0.3,
      escalationThreshold: 70,
    };

    const categoryMappings = [
      { systemCategory: 'availability', toolCategory: 'INFRA' },
      { systemCategory: 'performance', toolCategory: 'PERF' },
    ];

    const executionTimestampBefore = new Date('2024-01-15T10:30:00Z');

    mockAiClient = {
      action01_validateExtractedIssues: jest.fn().mockResolvedValue({
        validationStatus: 'valid',
        validatedCount: 1,
        issues: extractedIssueData,
      }),

      action02_judgeIssuePrioritiesAndCategories: jest.fn().mockResolvedValue({
        judgedIssues: [
          {
            issueId: extractedIssueId,
            priorityScore: 85,
            priorityRank: 'high' as const,
            matchedCategories: ['availability', 'performance'],
            categoryCount: 2,
            multipleCategories: true,
            judgmentConfidence: 0.92,
            judgmentReason: 'Issue matches both availability and performance categories based on symptom analysis',
          },
        ],
      }),

      action03_executeToolIntegrationSetup: jest.fn(),
      action04_registerIssueToExistingTool: jest.fn(),
      action05_recordIntegrationCompletion: jest.fn(),
      notifyHumanForEscalation: jest.fn().mockResolvedValue({
        notificationId: 'NOTIF-001',
        sentAt: new Date('2024-01-15T10:30:05Z').toISOString(),
      }),
      recordAuditEvent: jest.fn().mockResolvedValue({
        eventId: 'AUD-001',
        recorded: true,
      }),
    };

    const result = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      mockAiClient
    );

    expect(mockAiClient.action01_validateExtractedIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action02_judgeIssuePrioritiesAndCategories).toHaveBeenCalledTimes(1);

    expect(result.escalationDetected).toBe(true);
    expect(result.escalation_reason).toBe('multiple_categories');
    expect(result.human_review_required).toBe(true);

    const escalationTimestampStr = result.escalation_timestamp;
    expect(escalationTimestampStr).toBeDefined();
    const escalationTimestamp = new Date(escalationTimestampStr as string);
    expect(escalationTimestamp.getTime()).toBeGreaterThanOrEqual(
      executionTimestampBefore.getTime()
    );

    expect(result.escalated_issue_id).toBe(extractedIssueId);
    expect(result.escalated_matched_categories).toEqual(['availability', 'performance']);
    expect(result.escalation_judgment_reason).toBe(
      'Issue matches both availability and performance categories based on symptom analysis'
    );

    expect(mockAiClient.notifyHumanForEscalation).toHaveBeenCalledTimes(1);
    const notificationCall = mockAiClient.notifyHumanForEscalation.mock.calls[0];
    expect(notificationCall[0]).toMatchObject({
      issueId: extractedIssueId,
      matchedCategories: ['availability', 'performance'],
      judgmentReason: expect.stringMatching(/availability|performance/),
    });

    expect(mockAiClient.action03_executeToolIntegrationSetup).not.toHaveBeenCalled();
    expect(mockAiClient.action04_registerIssueToExistingTool).not.toHaveBeenCalled();
    expect(mockAiClient.action05_recordIntegrationCompletion).not.toHaveBeenCalled();

    expect(mockAiClient.recordAuditEvent).toHaveBeenCalledTimes(1);
    const auditCall = mockAiClient.recordAuditEvent.mock.calls[0];
    expect(auditCall[0]).toMatchObject({
      event_type: 'escalation',
      escalation_reason: 'multiple_categories',
      actor: 'ai_agent_tx5_imp1',
      issue_id: extractedIssueId,
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
    });

    expect(result.integrationResult.successCount).toBe(0);
    expect(result.integrationResult.failureCount).toBe(0);
    expect(result.integrationResult.escalatedCount).toBe(1);

    expect(result.executionSummary.totalIssuesProcessed).toBe(1);
    expect(result.executionSummary.escalationOccurred).toBe(true);
    expect(result.executionSummary.finalStatus).toBe('escalated');
  });
});