import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10Imp1AiClient } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('Tx10Imp1Agent - Rollback and Compensation', () => {
  // SCEN-193
  test('should rollback completed actions and record audit events when Action 3 fails', async () => {
    // Setup: Initialize fake AI client that implements Tx10Imp1AiClient interface
    const executedActions: string[] = [];
    const rollbackLog: Array<{ action: string; timestamp: string; resourceIds: string[] }> = [];
    const auditEvents: Array<{
      action: string;
      status: 'started' | 'completed' | 'failed';
      timestamp: string;
      resourceIds?: string[];
      errorDetails?: string;
    }> = [];

    const fakeAiClient: Tx10Imp1AiClient = {
      action01_generateDeploymentSchedule: async (input) => {
        const startTime = new Date('2024-01-15T09:00:00Z').toISOString();
        auditEvents.push({ action: 'action01', status: 'started', timestamp: startTime });
        executedActions.push('action01');

        const scheduleId = 'schedule_001';
        const completedTime = new Date('2024-01-15T09:05:00Z').toISOString();
        auditEvents.push({
          action: 'action01',
          status: 'completed',
          timestamp: completedTime,
          resourceIds: [scheduleId],
        });

        return {
          deploymentSchedule: {
            startDate: new Date('2024-01-20T00:00:00Z'),
            phase1Deadline: new Date('2024-01-22T00:00:00Z'),
            phase2Deadline: new Date('2024-01-25T00:00:00Z'),
            operationStartDate: new Date('2024-02-01T00:00:00Z'),
          },
        };
      },

      action02_generateTrainingMaterials: async (input) => {
        const startTime = new Date('2024-01-15T09:05:30Z').toISOString();
        auditEvents.push({ action: 'action02', status: 'started', timestamp: startTime });
        executedActions.push('action02');

        const guideId = 'guide_001';
        const completedTime = new Date('2024-01-15T09:10:00Z').toISOString();
        auditEvents.push({
          action: 'action02',
          status: 'completed',
          timestamp: completedTime,
          resourceIds: [guideId],
        });

        return {
          trainingMaterials: [
            {
              type: 'manager_guide',
              title: 'Manager Guide',
              contentUrl: 'https://example.com/guide.pdf',
            },
          ],
        };
      },

      action03_generateEngineerTrainingMaterials: async (input) => {
        const startTime = new Date('2024-01-15T09:10:30Z').toISOString();
        auditEvents.push({ action: 'action03', status: 'started', timestamp: startTime });
        executedActions.push('action03');

        // Intentionally fail at Action 3
        const failTime = new Date('2024-01-15T09:10:45Z').toISOString();
        auditEvents.push({
          action: 'action03',
          status: 'failed',
          timestamp: failTime,
          errorDetails: 'AI model training data insufficient',
        });

        throw new Error('AI model training data insufficient');
      },

      action04_analyzeInitialReportData: async (input) => {
        // Should not reach here
        executedActions.push('action04');
        return {
          submissionRate: 100,
          dataQualityScore: 85,
          formatUniformityScore: 90,
          feedbackItems: [],
        };
      },

      action05_createFeedbackProposal: async (input) => {
        // Should not reach here
        executedActions.push('action05');
        return {
          feedbackItems: [],
        };
      },

      action06_distributeApprovalRequest: async (input) => {
        // Should not reach here
        executedActions.push('action06');
        return {
          approvalRequestId: 'req_001',
          distributedAt: new Date('2024-01-15T09:15:00Z'),
        };
      },
    };

    // Setup: Test input
    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-01-15T08:00:00Z'),
      participantList: [
        {
          userId: 'user_001',
          role: 'ProjectManager',
          email: 'pm@example.com',
        },
        {
          userId: 'user_002',
          role: 'Manager',
          email: 'manager@example.com',
        },
        {
          userId: 'user_003',
          role: 'Engineer',
          email: 'engineer@example.com',
        },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    // Execute orchestrator and expect it to handle rollback
    let caughtError: Error | null = null;
    let result: Tx10AgentOutput | null = null;

    try {
      result = await runTx10Imp1Agent(input, fakeAiClient);
    } catch (error) {
      caughtError = error as Error;
    }

    // Verify: Action 3 failure was caught
    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/training data/);

    // Verify: Only Action 1 and Action 2 were executed before failure
    expect(executedActions).toEqual(['action01', 'action02', 'action03']);
    expect(executedActions).not.toContain('action04');
    expect(executedActions).not.toContain('action05');
    expect(executedActions).not.toContain('action06');

    // Verify: Audit events recorded start and completion of Action 1 and Action 2
    const action01Events = auditEvents.filter((e) => e.action === 'action01');
    expect(action01Events).toHaveLength(2);
    expect(action01Events[0].status).toBe('started');
    expect(action01Events[0].timestamp).toBe('2024-01-15T09:00:00Z');
    expect(action01Events[1].status).toBe('completed');
    expect(action01Events[1].timestamp).toBe('2024-01-15T09:05:00Z');
    expect(action01Events[1].resourceIds).toContain('schedule_001');

    const action02Events = auditEvents.filter((e) => e.action === 'action02');
    expect(action02Events).toHaveLength(2);
    expect(action02Events[0].status).toBe('started');
    expect(action02Events[0].timestamp).toBe('2024-01-15T09:05:30Z');
    expect(action02Events[1].status).toBe('completed');
    expect(action02Events[1].timestamp).toBe('2024-01-15T09:10:00Z');
    expect(action02Events[1].resourceIds).toContain('guide_001');

    // Verify: Audit event recorded Action 3 failure
    const action03Events = auditEvents.filter((e) => e.action === 'action03');
    expect(action03Events).toHaveLength(2);
    expect(action03Events[0].status).toBe('started');
    expect(action03Events[0].timestamp).toBe('2024-01-15T09:10:30Z');
    expect(action03Events[1].status).toBe('failed');
    expect(action03Events[1].timestamp).toBe('2024-01-15T09:10:45Z');
    expect(action03Events[1].errorDetails).toMatch(/training data/);

    // Verify: Audit events contain all required information
    expect(auditEvents.length).toBeGreaterThanOrEqual(6);
    const hasStartTimestamp = auditEvents.some((e) => e.timestamp === '2024-01-15T09:00:00Z');
    const hasCompletionTimestamps = auditEvents.filter(
      (e) => e.status === 'completed'
    ).length >= 2;
    const hasFailureTimestamp = auditEvents.some((e) => e.status === 'failed');
    const hasResourceIds = auditEvents.some((e) => e.resourceIds && e.resourceIds.length > 0);

    expect(hasStartTimestamp).toBe(true);
    expect(hasCompletionTimestamps).toBe(true);
    expect(hasFailureTimestamp).toBe(true);
    expect(hasResourceIds).toBe(true);

    // Verify: No actions beyond Action 3 were executed (rollback prevents further execution)
    const allExecutedActionCounts = {
      action01: executedActions.filter((a) => a === 'action01').length,
      action02: executedActions.filter((a) => a === 'action02').length,
      action03: executedActions.filter((a) => a === 'action03').length,
      action04: executedActions.filter((a) => a === 'action04').length,
      action05: executedActions.filter((a) => a === 'action05').length,
      action06: executedActions.filter((a) => a === 'action06').length,
    };

    expect(allExecutedActionCounts.action01).toBe(1);
    expect(allExecutedActionCounts.action02).toBe(1);
    expect(allExecutedActionCounts.action03).toBe(1);
    expect(allExecutedActionCounts.action04).toBe(0);
    expect(allExecutedActionCounts.action05).toBe(0);
    expect(allExecutedActionCounts.action06).toBe(0);
  });
});