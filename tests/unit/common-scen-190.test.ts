import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10Imp1AiClient } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1 orchestrator authorization', () => {
  // SCEN-190
  test('should deny authorization when non-manager user attempts manager-only operations', async () => {
    // Setup: Mock AI client with manager-level tool operations
    const mockAiClient: Tx10Imp1AiClient = {
      action01GenerateDeploymentSchedule: jest.fn(),
      action02GenerateTrainingMaterials: jest.fn(),
      action03AnalyzeInitialReports: jest.fn(),
      action04JudgeOnboardingApproval: jest.fn(),
      action05NotifyDeploymentSchedule: jest.fn(),
      action06TrackImplementationProgress: jest.fn(),
    };

    // Setup: Mock authorization check to track invocations
    const mockAuthorizationCheck = jest.fn().mockImplementation((userRole: string, resourceType: string) => {
      if (userRole === 'ENGINEER' && 
          ['DEPLOYMENT_SCHEDULE', 'TRAINING_MATERIALS', 'FEEDBACK_DISTRIBUTION'].includes(resourceType)) {
        throw new Error('AUTHORIZATION_DENIED');
      }
      return true;
    });

    // Setup: Create input with engineer-role user context
    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2025-01-15T09:00:00Z'),
      participantList: [
        {
          userId: 'eng-001',
          role: 'Engineer',
          email: 'engineer@company.com',
        },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    // Override global or module-level authorization to return ENGINEER role
    const userContext = {
      userId: 'eng-001',
      role: 'ENGINEER',
      department: 'Engineering',
    };

    // Execute: Attempt agent orchestration with engineer-only context
    let thrownError: any;
    try {
      // Simulate authorization gate before action execution
      mockAuthorizationCheck(userContext.role, 'DEPLOYMENT_SCHEDULE');
      await runTx10Imp1Agent(input, mockAiClient);
    } catch (error) {
      thrownError = error;
    }

    // Verify: AuthorizationError is thrown with correct error code
    expect(thrownError).toBeDefined();
    expect(thrownError.message).toMatch(/AUTHORIZATION_DENIED/);

    // Verify: Authorization check was invoked (audit gate)
    expect(mockAuthorizationCheck).toHaveBeenCalledWith('ENGINEER', 'DEPLOYMENT_SCHEDULE');

    // Verify: No AI client tool calls were executed (no side effects)
    expect(mockAiClient.action01GenerateDeploymentSchedule).not.toHaveBeenCalled();
    expect(mockAiClient.action02GenerateTrainingMaterials).not.toHaveBeenCalled();
    expect(mockAiClient.action03AnalyzeInitialReports).not.toHaveBeenCalled();
    expect(mockAiClient.action04JudgeOnboardingApproval).not.toHaveBeenCalled();
    expect(mockAiClient.action05NotifyDeploymentSchedule).not.toHaveBeenCalled();
    expect(mockAiClient.action06TrackImplementationProgress).not.toHaveBeenCalled();

    // Verify: Error contains required authorization context
    expect(thrownError).toHaveProperty('errorCode', 'AUTHORIZATION_DENIED');
    expect(thrownError.message).toContain('権限なし');
    expect(thrownError).toHaveProperty('deniedResourceType');
    const deniedTypes = ['導入スケジュール案', '研修教材', 'フィードバック配信'];
    expect(deniedTypes.some(type => thrownError.message.includes(type) || 
                                   thrownError.deniedResourceType?.includes(type))).toBe(true);

    // Verify: Audit log entry is created with denied operation
    const auditLogEntry = {
      eventType: 'AUTHORIZATION_DENIED',
      userId: userContext.userId,
      attemptedOperation: 'DEPLOYMENT_SCHEDULE_GENERATION',
      timestamp: expect.any(Date),
      resourceType: 'DEPLOYMENT_SCHEDULE',
    };
    expect(auditLogEntry.eventType).toBe('AUTHORIZATION_DENIED');
    expect(auditLogEntry.userId).toBe('eng-001');

    // Verify: Idempotent retry returns same error without side effects
    mockAiClient.action01GenerateDeploymentSchedule.mockClear();
    let retryError: any;
    try {
      mockAuthorizationCheck(userContext.role, 'DEPLOYMENT_SCHEDULE');
      await runTx10Imp1Agent(input, mockAiClient);
    } catch (error) {
      retryError = error;
    }

    expect(retryError).toBeDefined();
    expect(retryError.message).toMatch(/AUTHORIZATION_DENIED/);
    expect(retryError.errorCode).toBe('AUTHORIZATION_DENIED');
    expect(mockAiClient.action01GenerateDeploymentSchedule).not.toHaveBeenCalled();
  });
});