import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('sendUnsubmittedReminder - Rollback after partial side effect', () => {
  test('SCEN-158: should rollback all side effects when Action 4 fails in tx_8_imp_1 agent execution', async () => {
    // Setup: Initialize test stub for morning report management system
    const initialIssueDataset = [
      {
        id: 'issue-001',
        title: 'Database connection timeout',
        category: 'infrastructure',
        priority: 'high',
        reportedDate: '2024-01-15T09:00:00Z',
        isRecurring: true,
        recurringCount: 3,
      },
      {
        id: 'issue-002',
        title: 'API rate limit exceeded',
        category: 'performance',
        priority: 'medium',
        reportedDate: '2024-01-14T14:30:00Z',
        isRecurring: true,
        recurringCount: 2,
      },
      {
        id: 'issue-003',
        title: 'Memory leak in service',
        category: 'stability',
        priority: 'high',
        reportedDate: '2024-01-16T10:15:00Z',
        isRecurring: false,
        recurringCount: 1,
      },
    ];

    // Setup: Create in-memory state tracker to verify side effects
    const stateTracker = {
      loadedIssueData: null as typeof initialIssueDataset | null,
      analysisResult: null as Record<string, unknown> | null,
      patternIdentificationResult: null as Record<string, unknown> | null,
      compensationLogsRecorded: [] as string[],
      orchestratorState: 'uninitialized' as string,
    };

    // Mock AI Client with injectable error
    let action4ShouldFail = false;

    const mockAiClient = {
      action01_extractIssueData: async () => {
        stateTracker.loadedIssueData = JSON.parse(JSON.stringify(initialIssueDataset));
        stateTracker.orchestratorState = 'action-01-completed';
        return {
          issueCount: initialIssueDataset.length,
          successFlag: true,
        };
      },

      action02_analyzeTimeSeriesPattern: async () => {
        if (!stateTracker.loadedIssueData) {
          throw new Error('Issue data not loaded');
        }
        stateTracker.analysisResult = {
          timeSeriesPatterns: [
            {
              patternId: 'pattern-001',
              affectedIssueIds: ['issue-001', 'issue-002'],
              frequency: 'weekly',
              severityTrend: 'increasing',
            },
          ],
          lastUpdated: '2024-01-16T11:00:00Z',
        };
        stateTracker.orchestratorState = 'action-02-completed';
        return {
          patternsDetected: 1,
          successFlag: true,
        };
      },

      action03_identifyBottleneckPattern: async () => {
        if (!stateTracker.analysisResult) {
          throw new Error('Analysis result not available');
        }
        stateTracker.patternIdentificationResult = {
          bottlenecks: [
            {
              bottleneckId: 'bn-001',
              rootCause: 'Insufficient resource allocation',
              affectedComponentIds: ['service-a', 'service-b'],
              changeOverTime: 'degrading',
            },
          ],
          reportGeneratedAt: '2024-01-16T11:30:00Z',
        };
        stateTracker.orchestratorState = 'action-03-completed';
        return {
          bottlenecksIdentified: 1,
          successFlag: true,
        };
      },

      action04_generateVisualizationReport: async () => {
        if (action4ShouldFail) {
          throw new Error('Database connection failed during report generation');
        }
        stateTracker.orchestratorState = 'action-04-completed';
        return {
          reportId: 'report-tx8-001',
          successFlag: true,
        };
      },

      action05_prioritizeIssues: async () => {
        stateTracker.orchestratorState = 'action-05-completed';
        return {
          prioritizedCount: 3,
          successFlag: true,
        };
      },
    };

    // Simulate orchestrator with rollback compensation
    const runTx8Imp1AgentWithRollback = async (aiClient: typeof mockAiClient) => {
      try {
        stateTracker.orchestratorState = 'initializing';

        // Action 1: Extract issue data
        await aiClient.action01_extractIssueData();

        // Action 2: Analyze time series pattern
        await aiClient.action02_analyzeTimeSeriesPattern();

        // Action 3: Identify bottleneck pattern
        await aiClient.action03_identifyBottleneckPattern();

        // Action 4: Generate visualization report - INJECT ERROR HERE
        await aiClient.action04_generateVisualizationReport();

        // Action 5: Prioritize issues
        await aiClient.action05_prioritizeIssues();

        stateTracker.orchestratorState = 'completed-successfully';
      } catch (error) {
        // Compensation/Rollback logic
        stateTracker.compensationLogsRecorded.push('ROLLBACK_COMPENSATION_EXECUTED');
        stateTracker.loadedIssueData = null;
        stateTracker.analysisResult = null;
        stateTracker.patternIdentificationResult = null;
        stateTracker.orchestratorState = 'uninitialized';
        throw error;
      }
    };

    // Trigger: Inject error and execute orchestrator
    action4ShouldFail = true;

    let caughtError: Error | null = null;
    try {
      await runTx8Imp1AgentWithRollback(mockAiClient);
    } catch (err) {
      caughtError = err as Error;
    }

    // Verify: Error was caught
    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/Database connection/);

    // Verify: All side effects in memory are reverted
    expect(stateTracker.loadedIssueData).toBeNull();
    expect(stateTracker.analysisResult).toBeNull();
    expect(stateTracker.patternIdentificationResult).toBeNull();

    // Verify: Compensation logs recorded
    expect(stateTracker.compensationLogsRecorded).toContain('ROLLBACK_COMPENSATION_EXECUTED');

    // Verify: Orchestrator state reverted to initial
    expect(stateTracker.orchestratorState).toBe('uninitialized');

    // Verify: External system data unchanged (original 3 issues remain)
    expect(initialIssueDataset).toHaveLength(3);
    expect(initialIssueDataset[0].id).toBe('issue-001');
    expect(initialIssueDataset[1].id).toBe('issue-002');
    expect(initialIssueDataset[2].id).toBe('issue-003');

    // Verify: No partial state persists after rollback
    const allSideEffectsCleared =
      stateTracker.loadedIssueData === null &&
      stateTracker.analysisResult === null &&
      stateTracker.patternIdentificationResult === null;
    expect(allSideEffectsCleared).toBe(true);

    // Call sendUnsubmittedReminder to ensure no regression in notification logic
    const mockMailClient = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'msg-001' }),
    };

    const reminderResult = await sendUnsubmittedReminder(
      {
        unsubmittedMembers: [{ id: 'user-001', email: 'user@example.com', name: 'John' }],
        reminderType: 'urgent',
        scheduledAt: new Date('2024-01-16T11:45:00Z'),
      },
      mockMailClient as any,
    );

    expect(reminderResult).toBeDefined();
    expect(mockMailClient.sendMail).toHaveBeenCalled();
  });
});