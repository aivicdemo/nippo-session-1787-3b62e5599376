import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AgentInput, type Tx5Imp1AgentOutput, type ExtractedIssue, type ToolIntegrationConfig, type PriorityRuleSet, type CategoryMapping } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('Tx5Imp1Agent - Idempotent Issue Extraction and Tool Integration', () => {
  // SCEN-103
  test('should skip duplicate issue extraction on second execution and maintain single tool integration record with deduplication audit log', async () => {
    // Setup: Mock data for first and second execution
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'ISSUE-001',
        title: 'Critical Bug in Production',
        description: 'Database connection timeout in production environment',
        severity: 'high',
        reportedBy: 'engineer-001',
        reportedAt: '2024-01-15T10:00:00Z',
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/api/v3',
      apiToken: 'fake-token',
      projectKey: 'PROJ',
    };

    const priorityRules: PriorityRuleSet = {
      highImpactKeywords: ['production', 'critical', 'outage'],
      frequencyThreshold: 2,
      impactWeights: {
        critical: 100,
        high: 80,
        medium: 50,
        low: 20,
      },
    };

    const categoryMappings: CategoryMapping[] = [
      {
        sourceName: 'Bug',
        targetCategory: 'Bug',
        toolSpecificId: 'BUG',
      },
      {
        sourceName: 'Feature',
        targetCategory: 'Feature',
        toolSpecificId: 'FEATURE',
      },
    ];

    // Spy counters for API calls
    let jiraPostCallCount = 0;
    let asanaPostCallCount = 0;
    let notificationCallCount = 0;
    const deduplicationAuditLog: Array<{
      issueId: string;
      executionTimestamp: string;
      status: string;
      deduplicationKeyHash: string;
      firstExecutionTimestamp?: string;
      duplicateDetectedTimestamp?: string;
    }> = [];
    const toolIntegrationRecords: Array<{
      issueId: string;
      toolType: string;
      toolIssueId: string;
      status: string;
      createdAt: string;
    }> = [];

    // Mock AI client
    const mockAiClient = {
      validateExtractedIssuesAction: jest
        .fn()
        .mockResolvedValue({
          validatedIssues: [
            {
              issueId: 'ISSUE-001',
              priorityScore: 95,
              priorityRank: 'high',
              category: 'Bug',
              toolIssueId: null,
              validationStatus: 'valid',
            },
          ],
        }),
      determinePriorityAndCategoryAction: jest
        .fn()
        .mockResolvedValue({
          categorizedIssues: [
            {
              issueId: 'ISSUE-001',
              priorityScore: 95,
              priorityRank: 'high',
              category: 'Bug',
              toolIssueId: null,
              validationStatus: 'valid',
            },
          ],
        }),
      detectDuplicateIssuesAction: jest
        .fn()
        .mockResolvedValue({
          deduplicationKey: 'ISSUE-001|2024-01-15T10:00:00Z|hash-001',
          isDuplicate: false,
          previousExecutionTimestamp: null,
        }),
      executeToolIntegrationAction: jest
        .fn()
        .mockImplementation(async (issues) => {
          jiraPostCallCount += 1;
          toolIntegrationRecords.push({
            issueId: 'ISSUE-001',
            toolType: 'jira',
            toolIssueId: `PROJ-${jiraPostCallCount}`,
            status: 'INTEGRATED',
            createdAt: '2024-01-15T10:05:00Z',
          });
          return {
            toolIssueId: `PROJ-${jiraPostCallCount}`,
            status: 'INTEGRATED',
          };
        }),
      sendCompletionNotificationAction: jest
        .fn()
        .mockImplementation(async (payload) => {
          notificationCallCount += 1;
          return { status: 'SENT' };
        }),
      recordDeduplicationAuditAction: jest
        .fn()
        .mockImplementation(async (payload) => {
          deduplicationAuditLog.push(payload);
          return { recorded: true };
        }),
    };

    const input1: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // FIRST EXECUTION
    const result1: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input1, mockAiClient as any);

    expect(result1).toBeDefined();
    expect(result1.validatedIssues).toHaveLength(1);
    expect(result1.validatedIssues[0].issueId).toBe('ISSUE-001');
    expect(result1.validatedIssues[0].validationStatus).toBe('valid');
    expect(result1.integrationResult.successCount).toBe(1);
    expect(result1.integrationResult.failureCount).toBe(0);
    expect(result1.executionSummary.status).toBe('COMPLETED');

    // Verify first execution called tool integration
    expect(jiraPostCallCount).toBe(1);
    expect(notificationCallCount).toBe(1);
    expect(toolIntegrationRecords).toHaveLength(1);
    expect(toolIntegrationRecords[0].toolIssueId).toBe('PROJ-1');
    expect(toolIntegrationRecords[0].status).toBe('INTEGRATED');

    // Verify first deduplication audit log entry
    expect(deduplicationAuditLog).toHaveLength(1);
    expect(deduplicationAuditLog[0].issueId).toBe('ISSUE-001');
    expect(deduplicationAuditLog[0].status).toBe('COMPLETED');
    const firstExecutionTimestamp = deduplicationAuditLog[0].firstExecutionTimestamp || '2024-01-15T10:05:00Z';

    // SECOND EXECUTION - Mock detectDuplicateIssuesAction to return duplicate detected
    mockAiClient.detectDuplicateIssuesAction.mockResolvedValueOnce({
      deduplicationKey: 'ISSUE-001|2024-01-15T10:00:00Z|hash-001',
      isDuplicate: true,
      previousExecutionTimestamp: firstExecutionTimestamp,
    });

    mockAiClient.executeToolIntegrationAction.mockResolvedValueOnce({
      status: 'SKIPPED_DUPLICATE',
    });

    mockAiClient.recordDeduplicationAuditAction.mockImplementationOnce(async (payload) => {
      deduplicationAuditLog.push({
        issueId: payload.issueId,
        executionTimestamp: payload.duplicateDetectedTimestamp,
        status: 'SKIPPED_DUPLICATE',
        deduplicationKeyHash: payload.deduplicationKeyHash,
        firstExecutionTimestamp: payload.firstExecutionTimestamp,
        duplicateDetectedTimestamp: payload.duplicateDetectedTimestamp,
      });
      return { recorded: true };
    });

    const input2: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    const result2: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input2, mockAiClient as any);

    expect(result2).toBeDefined();
    expect(result2.validatedIssues).toHaveLength(1);
    expect(result2.executionSummary.status).toBe('COMPLETED');

    // Verify second execution did NOT call tool integration (skipped duplicate)
    expect(jiraPostCallCount).toBe(1); // Still 1, not 2
    expect(notificationCallCount).toBe(1); // Still 1, not 2
    expect(toolIntegrationRecords).toHaveLength(1); // Still 1 record
    expect(toolIntegrationRecords[0].toolIssueId).toBe('PROJ-1');

    // Verify second deduplication audit log entry shows SKIPPED_DUPLICATE
    expect(deduplicationAuditLog).toHaveLength(2);
    expect(deduplicationAuditLog[1].issueId).toBe('ISSUE-001');
    expect(deduplicationAuditLog[1].status).toBe('SKIPPED_DUPLICATE');
    expect(deduplicationAuditLog[1].firstExecutionTimestamp).toBe(firstExecutionTimestamp);
    expect(deduplicationAuditLog[1].duplicateDetectedTimestamp).toBeDefined();

    // Verify no duplicate tool records were created
    const jiraIssueCount = toolIntegrationRecords.filter(
      (r) => r.toolType === 'jira'
    ).length;
    expect(jiraIssueCount).toBe(1);

    // Verify integration result indicates no new integrations in second execution
    expect(result2.integrationResult.successCount).toBe(0);
    expect(result2.integrationResult.skippedDuplicateCount).toBe(1);
    expect(result2.integrationResult.failureCount).toBe(0);

    // Verify deduplication key format and content
    const deduplicationRecord = deduplicationAuditLog[1];
    expect(deduplicationRecord.deduplicationKeyHash).toBe('ISSUE-001|2024-01-15T10:00:00Z|hash-001');
    expect(deduplicationRecord.issueId).toBe('ISSUE-001');
    expect(deduplicationRecord.status).toBe('SKIPPED_DUPLICATE');
  });
});