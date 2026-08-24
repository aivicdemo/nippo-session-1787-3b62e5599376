import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type ExtractedIssue, type ToolIntegrationConfig, type PriorityRuleSet, type CategoryMapping } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 orchestrator', () => {
  test('SCEN-3152: escalation when priority confidence below threshold', async () => {
    // Prepare test data: extracted issues with valid format and content
    const extracted_issues: ExtractedIssue[] = [
      {
        issueId: 'ISSUE-001',
        issueText: 'Database query performance degradation in production',
        occurrenceCount: 3,
        affectedTeams: ['backend', 'devops'],
        severity: 'high',
        extractedAt: '2024-01-15T10:00:00Z',
      },
      {
        issueId: 'ISSUE-002',
        issueText: 'API response timeout intermittently',
        occurrenceCount: 2,
        affectedTeams: ['api-team'],
        severity: 'medium',
        extractedAt: '2024-01-15T10:05:00Z',
      },
    ];

    const tool_integration_config: ToolIntegrationConfig = {
      toolType: 'jira',
      baseUrl: 'https://jira.example.com',
      apiToken: 'dummy-token',
      projectKey: 'PROJ',
    };

    const priority_rules: PriorityRuleSet = {
      occurrenceWeighting: 0.4,
      severityWeighting: 0.3,
      affectedTeamsWeighting: 0.3,
      highScoreThreshold: 70,
      mediumScoreThreshold: 40,
      confidenceThreshold: 0.5,
    };

    const category_mappings: CategoryMapping[] = [
      { systemKeyword: 'Database', toolCategory: 'Infrastructure' },
      { systemKeyword: 'API', toolCategory: 'Backend' },
    ];

    // Track escalation notifications sent to NotificationServiceAdapter
    const escalation_notifications: any[] = [];
    const executed_actions: string[] = [];

    // Inject fake AI client with escalation scenario
    const fake_ai_client: Tx5Imp1AiClient = {
      async executeAction01_ValidateIssueData(input: any) {
        executed_actions.push('action-01');
        return {
          validationPassed: true,
          validationDetails: {
            formatValid: true,
            contentComplete: true,
            issuesProcessed: extracted_issues.length,
          },
        };
      },

      async executeAction02_JudgePriorityAndCategory(input: any) {
        executed_actions.push('action-02');
        // Return low confidence score below threshold (0.35 < 0.5)
        return {
          judgments: [
            {
              issueId: 'ISSUE-001',
              priorityScore: 68,
              priorityRank: 'high',
              category: 'Infrastructure',
              confidenceScore: 0.35, // Below threshold of 0.5
              reasoning: 'Multiple affected teams but limited occurrence history',
            },
            {
              issueId: 'ISSUE-002',
              priorityScore: 42,
              priorityRank: 'medium',
              category: 'Backend',
              confidenceScore: 0.35,
              reasoning: 'Unclear impact scope',
            },
          ],
          promptVersion: 'ACTION_02_PROMPT_VERSION_v1.0.0',
          executedAt: '2024-01-15T10:30:00Z',
        };
      },

      async executeAction03_SetupToolIntegration(input: any) {
        executed_actions.push('action-03');
        throw new Error('This action should not be executed in escalation scenario');
      },

      async executeAction04_RegisterToExistingTools(input: any) {
        executed_actions.push('action-04');
        throw new Error('This action should not be executed in escalation scenario');
      },

      async executeAction05_ConfirmIntegrationCompletion(input: any) {
        executed_actions.push('action-05');
        throw new Error('This action should not be executed in escalation scenario');
      },
    };

    // Inject fake NotificationServiceAdapter
    const fake_notification_service = {
      sendReminderNotification: async (userId: string, message: string, metadata: any) => {
        escalation_notifications.push({
          userId,
          message,
          metadata,
          sentAt: new Date().toISOString(),
        });
        return { deliveryStatus: 'sent', deliveryId: 'NOTIF-123' };
      },
      sendEscalationNotification: async (escalationData: any) => {
        escalation_notifications.push({
          type: 'escalation',
          escalationData,
          sentAt: new Date().toISOString(),
        });
        return { deliveryStatus: 'sent', deliveryId: 'ESC-456' };
      },
    };

    // Execute the agent
    const result = await runTx5Imp1Agent(
      {
        extractedIssueData: extracted_issues,
        toolIntegrationConfig: tool_integration_config,
        priorityRules: priority_rules,
        categoryMappings: category_mappings,
      },
      fake_ai_client,
      fake_notification_service
    );

    // Verify escalation occurred and subsidiary actions did not execute
    expect(executed_actions).toEqual(['action-01', 'action-02']);
    expect(executed_actions).not.toContain('action-03');
    expect(executed_actions).not.toContain('action-04');
    expect(executed_actions).not.toContain('action-05');

    // Verify agent result indicates escalation status
    expect(result.executionSummary.status).toBe('pending_human_review');
    expect(result.executionSummary.escalationReason).toBe('priority_confidence_below_threshold');

    // Verify escalation notification was sent
    expect(escalation_notifications.length).toBeGreaterThan(0);
    const escalation_notif = escalation_notifications.find((n) => n.type === 'escalation');
    expect(escalation_notif).toBeDefined();
    expect(escalation_notif.escalationData).toMatchObject({
      condition: 'priority_confidence_below_threshold',
      confidenceThreshold: 0.5,
      actualConfidenceScore: 0.35,
      issueIds: ['ISSUE-001', 'ISSUE-002'],
      judgmentVersion: 'ACTION_02_PROMPT_VERSION_v1.0.0',
    });

    // Verify no tool integration occurred
    expect(result.integrationResult).toMatchObject({
      successCount: 0,
      failureCount: 0,
      toolIssueIds: [],
      status: 'pending_human_review',
    });

    // Verify escalation history record
    expect(result.executionSummary.escalationHistory).toContainEqual(
      expect.objectContaining({
        escalationCondition: 'priority_confidence_below_threshold',
        humanReviewStatus: 'awaiting_assignment',
        agentExecutionId: expect.any(String),
      })
    );

    // Verify validated issues are returned but marked as pending review
    expect(result.validatedIssues.length).toBe(2);
    result.validatedIssues.forEach((issue) => {
      expect(issue.validationStatus).toBe('warning');
      expect(issue.priorityScore).toBeGreaterThan(0);
      expect(issue.toolIssueId).toBeNull();
    });
  });
});