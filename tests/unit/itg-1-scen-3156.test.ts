import { describe, test, expect, jest } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行 - AIエージェント', () => {
  // SCEN-3156: 不正・曖昧・低確信度のAI出力を拒否して安全に引き継ぐ
  test('should reject low-confidence AI output and escalate to human review', async () => {
    // Prepare fake AI client that returns low-confidence output
    const fakeAiClient = {
      validateIssueFormat: jest.fn().mockResolvedValue({
        isValid: true,
        confidenceScore: 0.25,
        validationReason: 'Format is valid but confidence is low'
      }),
      judgeIssuePriority: jest.fn(),
      classifyIssueCategory: jest.fn(),
      determineToolMapping: jest.fn(),
      executeToolIntegration: jest.fn()
    };

    // Prepare fake notification service adapter
    const fakeNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        success: true,
        deliveryStatus: 'sent',
        timestamp: new Date('2024-01-15T11:00:00Z').toISOString()
      })
    };

    // Prepare fake audit logger
    const fakeAuditLogger = {
      logAction: jest.fn(),
      getLog: jest.fn()
    };

    // Input: extracted issue data with low-confidence AI output
    const input = {
      extractedIssueData: [
        {
          issueId: 'ISSUE-001',
          issueText: '不明な問題が発生',
          extractionTimestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
          extractedBy: 'system'
        }
      ],
      toolIntegrationConfig: {
        toolType: 'jira' as const,
        apiEndpoint: 'https://jira.example.com',
        projectKey: 'TEST'
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        recurrenceThreshold: 3
      },
      categoryMappings: [
        {
          systemCategory: 'quality',
          toolCategory: 'Quality Defect'
        }
      ]
    };

    // Execute agent
    const result = await runTx5Imp1Agent(input, fakeAiClient, fakeNotificationAdapter, fakeAuditLogger);

    // Verify escalation status is set to LOW_CONFIDENCE
    expect(result.executionSummary.escalationStatus).toBe('LOW_CONFIDENCE');

    // Verify escalation condition: confidence score below threshold
    expect(result.executionSummary.finalStatus).toBe('ESCALATED_TO_HUMAN');

    // Verify auto-processing is skipped (actions 2, 3, 4, 5 not executed)
    expect(result.integrationResult.toolIntegrationExecuted).toBe(false);

    // Verify notification to human was sent
    expect(fakeNotificationAdapter.sendReminderNotification).toHaveBeenCalled();

    // Verify notification payload contains specific error reason
    const notificationCall = fakeNotificationAdapter.sendReminderNotification.mock.calls[0];
    const notificationPayload = notificationCall[0];
    expect(notificationPayload).toContain('信頼度が低いため人間確認が必要');
    expect(notificationPayload).toContain('0.25');
    expect(notificationPayload).toContain('0.50');

    // Verify issue status is set to waiting for human review
    expect(result.validatedIssues[0].validationStatus).toBe('invalid');

    // Verify tool integration result is empty (no tool integration executed)
    expect(result.integrationResult.successfulIntegrations).toBe(0);
    expect(result.integrationResult.failedIntegrations).toBe(0);

    // Verify audit log contains rejection record with specific reason
    expect(fakeAuditLogger.logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        agentModule: 'tx-5-imp-1',
        actionName: 'validate_confidence',
        result: 'REJECT',
        reason: 'confidence_score_0.25_below_threshold_0.50'
      })
    );

    // Verify idempotency: re-execute with same output
    fakeAiClient.validateIssueFormat.mockClear();
    fakeNotificationAdapter.sendReminderNotification.mockClear();

    const retryResult = await runTx5Imp1Agent(input, fakeAiClient, fakeNotificationAdapter, fakeAuditLogger);

    // Verify same escalation state on retry
    expect(retryResult.executionSummary.escalationStatus).toBe('LOW_CONFIDENCE');
    expect(retryResult.executionSummary.finalStatus).toBe('ESCALATED_TO_HUMAN');

    // Verify notification sent again (idempotent)
    expect(fakeNotificationAdapter.sendReminderNotification).toHaveBeenCalled();

    // Verify execution timestamp is recorded
    expect(result.executionSummary.executionTimestamp).toBeDefined();
    expect(typeof result.executionSummary.executionTimestamp).toBe('string');

    // Verify no tool integration was attempted
    expect(fakeAiClient.executeToolIntegration).not.toHaveBeenCalled();

    // Verify validated issues contain rejection marker
    expect(result.validatedIssues).toHaveLength(1);
    expect(result.validatedIssues[0].issueId).toBe('ISSUE-001');
    expect(result.validatedIssues[0].validationStatus).toBe('invalid');
  });
});