import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10Imp1AiClient } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('Tx10Imp1Agent', () => {
  // SCEN-188
  test('should reject low-confidence AI output and escalate to human review', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const participantList = [
      {
        userId: 'PM001',
        role: 'ProjectManager',
        email: 'pm@example.com'
      },
      {
        userId: 'MGR001',
        role: 'Manager',
        email: 'mgr@example.com'
      },
      {
        userId: 'ENG001',
        role: 'Engineer',
        email: 'eng1@example.com'
      }
    ];

    const mockAiClient: Tx10Imp1AiClient = {
      callAction01: async () => ({
        deploymentSchedule: {
          startDate: null,
          initiationPhaseDeadline: undefined,
          trainingPhaseDeadline: new Date('2024-01-25T17:00:00Z'),
          pilotPhaseDeadline: new Date('2024-02-08T17:00:00Z'),
          operationStartDate: new Date('2024-02-15T09:00:00Z'),
          phaseDetails: [
            {
              phaseName: 'preparation',
              startDate: null,
              endDate: undefined,
              assignedOwner: '',
              keyActivities: []
            }
          ]
        },
        confidence: 0.45,
        reasoning: 'Partial schedule generation with missing dates'
      }),
      callAction02: async () => ({
        trainingMaterials: [],
        confidence: 0.8,
        reasoning: ''
      }),
      callAction03: async () => ({
        initialReportAnalysis: {
          submissionRate: 0,
          dataQualityScore: 0,
          formatUniformityScore: 0,
          feedbackItems: []
        },
        confidence: 0.8,
        reasoning: ''
      }),
      callAction04: async () => ({
        onboardingApprovalStatus: {
          approved: false,
          reason: ''
        },
        confidence: 0.5,
        reasoning: ''
      }),
      callAction05: async () => ({
        onboardingApprovalStatus: {
          approved: false,
          reason: ''
        },
        confidence: 0.8,
        reasoning: ''
      }),
      callAction06: async () => ({
        onboardingApprovalStatus: {
          approved: false,
          reason: ''
        },
        confidence: 0.8,
        reasoning: ''
      })
    };

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00'
    };

    const result = await runTx10Imp1Agent(input, mockAiClient);

    expect(result.status).toBe('ESCALATION_REQUIRED');
    expect(result.escalationCondition).toBe('LOW_CONFIDENCE_OUTPUT');
    expect(result.escalationReason).toContain('confidence=0.45');
    expect(result.escalationReason).toContain('threshold=0.7');
    expect(result.currentAction).toBe('action-01');
    expect(result.actionExecuted).toBe(false);
    expect(result.humanReviewRequired).toBe(true);

    const auditLog = result.auditLog || [];
    expect(auditLog.length).toBeGreaterThan(0);

    const rejectionEvent = auditLog.find(
      (log) => log.action === 'REJECTION' && log.actionId === 'action-01'
    );
    expect(rejectionEvent).toBeDefined();
    expect(rejectionEvent?.status).toBe('REJECTED');
    expect(rejectionEvent?.reason).toContain('confidence=0.45 < threshold=0.7');
    expect(rejectionEvent?.operator).toBe('AGENT_VALIDATION');

    expect(result.internalState.actionSequenceIndex).toBe(0);
    expect(result.internalState.completedActions).toEqual([]);
    expect(result.deploymentSchedule).toBeUndefined();
    expect(result.trainingMaterials).toBeUndefined();
  });
});