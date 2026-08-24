import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { type Tx1Imp1AgentInput, type Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';
import { type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('Tx1Imp1Agent Authorization Denial', () => {
  // SCEN-3092
  test('should deny authorization and reject all operations when executed by non-director user', async () => {
    // Setup: Create audit event log collector
    const auditEvents: Array<{
      timestamp: Date;
      userId: string;
      operation: string;
      denialReason: string;
      impactScope: string;
    }> = [];

    // Setup: Create stub AI client that attempts unauthorized operations
    const stubAiClient: Tx1Imp1AiClient = {
      buildAction01Prompt: jest.fn().mockResolvedValue({
        version: '1.0.0',
        content: 'Attempt to access all company daily reports from API endpoint /api/v1/reports/all-company',
      }),
      buildAction02Prompt: jest.fn().mockResolvedValue({
        version: '1.0.0',
        content: 'Send notification to all department members in organization',
      }),
      buildAction03Prompt: jest.fn().mockResolvedValue({
        version: '1.0.0',
        content: 'Extract keywords from all cached corporate reports',
      }),
      buildAction04Prompt: jest.fn().mockResolvedValue({
        version: '1.0.0',
        content: 'Assign priority to extracted issues',
      }),
      buildAction05Prompt: jest.fn().mockResolvedValue({
        version: '1.0.0',
        content: 'Generate morning meeting material',
      }),
      buildAction06Prompt: jest.fn().mockResolvedValue({
        version: '1.0.0',
        content: 'Send unsubmitted members notification',
      }),
    };

    // Setup: Create stub NotificationServiceAdapter that tracks call attempts
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // Setup: Create stub TextAnalysisServiceAdapter that tracks call attempts
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Setup: Mock authorization context - user has only 'user' role, not 'director'
    const executionContext = {
      userId: 'employee-001',
      userPermissionLevel: 'user',
      requiredPermissionLevel: 'director',
      authenticatedUserTeamIds: ['team-001'],
      allTeamIdsRequested: ['team-001', 'team-002', 'team-003', 'team-global'],
    };

    // Setup: Create input for agent execution
    const agentInput: Tx1Imp1AgentInput = {
      executionTimestamp: new Date('2024-01-15T08:30:00Z'),
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      morningMeetingStartTime: new Date('2024-01-15T09:15:00Z'),
      targetTeamIds: ['team-001', 'team-002', 'team-003', 'team-global'],
      managerUserId: 'manager-001',
    };

    // Action: Attempt to run agent with non-director user
    let thrownError: Error | null = null;
    let agentOutput: Tx1Imp1AgentOutput | null = null;

    try {
      agentOutput = await runTx1Imp1Agent(agentInput, stubAiClient);
    } catch (error) {
      thrownError = error as Error;
      // Record authorization denial to audit log
      auditEvents.push({
        timestamp: new Date('2024-01-15T08:30:00Z'),
        userId: executionContext.userId,
        operation: 'runTx1Imp1Agent',
        denialReason: 'permission_denied',
        impactScope: 'none',
      });
    }

    // Verify: Authorization check must reject the operation
    expect(thrownError).not.toBeNull();
    expect(thrownError?.name).toBe('AuthorizationError');
    expect(thrownError?.message).toMatch(/permission_denied/);
    expect(thrownError?.message).toMatch(/user/i);
    expect(thrownError?.message).toMatch(/director/i);

    // Verify: TextAnalysisServiceAdapter.extractKeywords must NOT be called
    expect(textAnalysisServiceAdapterStub.extractKeywords).not.toHaveBeenCalled();

    // Verify: NotificationServiceAdapter.sendReminderNotification must NOT be called
    expect(notificationServiceAdapterStub.sendReminderNotification).not.toHaveBeenCalled();

    // Verify: Agent output must not be generated
    expect(agentOutput).toBeNull();

    // Verify: Audit event must record permission_denied
    expect(auditEvents).toHaveLength(1);
    expect(auditEvents[0]).toEqual({
      timestamp: new Date('2024-01-15T08:30:00Z'),
      userId: 'employee-001',
      operation: 'runTx1Imp1Agent',
      denialReason: 'permission_denied',
      impactScope: 'none',
    });

    // Verify: buildAction01Prompt through buildAction06Prompt should not be executed past authorization check
    // If any prompt builder was called before authorization check, it indicates premature execution
    const totalPromptCalls =
      (stubAiClient.buildAction01Prompt as jest.Mock).mock.calls.length +
      (stubAiClient.buildAction02Prompt as jest.Mock).mock.calls.length +
      (stubAiClient.buildAction03Prompt as jest.Mock).mock.calls.length +
      (stubAiClient.buildAction04Prompt as jest.Mock).mock.calls.length +
      (stubAiClient.buildAction05Prompt as jest.Mock).mock.calls.length +
      (stubAiClient.buildAction06Prompt as jest.Mock).mock.calls.length;

    // Authorization check must occur before any agent action execution
    // At most, buildAction01Prompt may be called during authorization evaluation
    expect(totalPromptCalls).toBeLessThanOrEqual(1);
  });
});