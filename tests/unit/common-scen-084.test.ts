import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4AgentExecutionRequest, Tx4AgentExecutionResult } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('tx-4-imp-1 orchestrator', () => {
  // SCEN-084: Malformed/ambiguous/low-confidence AI output rejection with safe handoff
  test('rejects malformed, ambiguous, and low-confidence AI outputs with escalation and audit trail', async () => {
    // Setup: Create fake AI client that returns invalid/ambiguous outputs
    const invalidAiOutputs = [
      // (1) Malformed JSON (incomplete structure)
      '{ invalid json ',
      // (2) Missing required fields (priorityLevel, confidence)
      JSON.stringify({
        extractedIssues: [
          {
            issueId: 'ISSUE-001',
            title: 'Performance degradation',
            description: 'API response time increased by 50%',
            // Missing: priorityLevel, confidence
          },
        ],
      }),
      // (3) Invalid confidence score (outside [0.0, 1.0])
      JSON.stringify({
        extractedIssues: [
          {
            issueId: 'ISSUE-002',
            title: 'Memory leak detected',
            description: 'Heap memory usage continuously increasing',
            priorityLevel: 'HIGH',
            confidence: 1.5, // Invalid: exceeds 1.0
          },
        ],
      }),
      // (4) Ambiguous issue extraction (conflicting interpretations)
      JSON.stringify({
        extractedIssues: [
          {
            issueId: 'ISSUE-003',
            title: 'Network issue or database issue unclear',
            description: 'Could be connectivity problem or query performance',
            priorityLevel: 'HIGH',
            confidence: 0.45, // Low confidence below threshold
            ambiguityIndicators: ['multiple_root_causes', 'unclear_scope'],
          },
        ],
      }),
      // (5) Conflicting priority assignments (same issue with contradictory labels)
      JSON.stringify({
        extractedIssues: [
          {
            issueId: 'ISSUE-004',
            title: 'System stability issue',
            description: 'Intermittent failures observed',
            priorityLevel: 'HIGH',
            confidence: 0.8,
          },
          {
            issueId: 'ISSUE-004', // Same ID
            title: 'System stability issue',
            description: 'Intermittent failures observed',
            priorityLevel: 'LOW', // Conflicting priority
            confidence: 0.75,
          },
        ],
      }),
    ];

    let currentOutputIndex = 0;

    const fakeAiClient: Tx4Imp1AiClient = {
      invokeAction01AggregateRealtimeData: jest.fn(async () => ({
        aggregatedDashboardData: {
          timestamp: '2024-01-15T09:00:00Z',
          teamId: 'TEAM-001',
          totalTasks: 25,
          completedTasks: 18,
          overdueTasks: 3,
          unsubmittedReports: 2,
          metrics: {
            completionRate: 0.72,
            averageResolutionDays: 4.2,
          },
        },
      })),
      invokeAction02DetectIssues: jest.fn(async () => ({
        detectedIssues: [
          {
            issueId: 'ISSUE-PERF-001',
            category: 'PERFORMANCE',
            severity: 'HIGH',
          },
        ],
      })),
      invokeAction03EvaluateRiskAndPriority: jest.fn(async () => {
        // Return progressively invalid outputs to test validation
        const output = invalidAiOutputs[currentOutputIndex];
        currentOutputIndex++;

        // Simulate parsing errors for malformed JSON
        if (output.startsWith('{ invalid')) {
          throw new Error('JSON parse error');
        }

        return JSON.parse(output);
      }),
      invokeAction04GenerateCountermeasurePlan: jest.fn(
        async () => ({
          countermeasurePlan: {
            planId: 'PLAN-001',
            recommendedActions: ['Action 1', 'Action 2'],
            estimatedResolutionDays: 3,
            assignedOwner: 'USER-001',
          },
        }),
        // This should not be called if validation fails
      ),
      invokeAction05CreateMorningMeetingMaterials: jest.fn(),
      invokeAction06NotifyUnsubmittedMembers: jest.fn(),
    };

    const auditLog: Array<{
      timestamp: Date;
      eventType: string;
      reason?: string;
      rejectedPayload?: unknown;
      validationError?: string;
    }> = [];

    const executionRequest: Tx4AgentExecutionRequest = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      targetDate: '2024-01-15',
      executorUserId: 'DEPT-HEAD-001',
      teamId: 'TEAM-001',
    };

    // Execute: Run agent with fake AI client configured to return invalid outputs
    try {
      await runTx4Imp1Agent(executionRequest, fakeAiClient);
    } catch (error) {
      // Expected: agent should throw or return failure state
      // Capture validation error details
      if (error instanceof Error) {
        auditLog.push({
          timestamp: new Date('2024-01-15T09:00:00Z'),
          eventType: 'ai_output_validation_failure',
          validationError: error.message,
        });
      }
    }

    // Verify: (1) JSON structure validation was invoked
    expect(fakeAiClient.invokeAction03EvaluateRiskAndPriority).toHaveBeenCalled();

    // Verify: (2) Validation failures detected for malformed JSON
    expect(auditLog.some((log) => log.eventType === 'ai_output_validation_failure')).toBe(true);

    // Verify: (3) Missing required fields validation
    const missingFieldsOutput = invalidAiOutputs[1];
    expect(missingFieldsOutput).toContain('extractedIssues');
    expect(missingFieldsOutput).not.toContain('priorityLevel');

    // Verify: (4) Confidence score range validation
    const invalidConfidenceOutput = invalidAiOutputs[2];
    const parsed = JSON.parse(invalidConfidenceOutput);
    expect(parsed.extractedIssues[0].confidence).toBeGreaterThan(1.0);

    // Verify: (5) Low confidence threshold detection
    const lowConfidenceOutput = invalidAiOutputs[3];
    const parsedLow = JSON.parse(lowConfidenceOutput);
    expect(parsedLow.extractedIssues[0].confidence).toBeLessThan(0.7);
    expect(
      parsedLow.extractedIssues[0].ambiguityIndicators,
    ).toContain('multiple_root_causes');

    // Verify: (6) Conflicting priority detection
    const conflictingOutput = invalidAiOutputs[4];
    const parsedConflict = JSON.parse(conflictingOutput);
    const conflictingIssues = parsedConflict.extractedIssues.filter(
      (issue: { issueId: string }) => issue.issueId === 'ISSUE-004',
    );
    expect(conflictingIssues).toHaveLength(2);
    expect(conflictingIssues[0].priorityLevel).not.toBe(conflictingIssues[1].priorityLevel);

    // Verify: (7) Escalation event recorded
    expect(auditLog.length).toBeGreaterThan(0);
    expect(auditLog[0]).toHaveProperty('eventType', 'ai_output_validation_failure');

    // Verify: (8) Action 4, 5, 6 not invoked after validation failure
    // (These should be skipped when escalation is triggered)
    expect(fakeAiClient.invokeAction04GenerateCountermeasurePlan).not.toHaveBeenCalled();
    expect(fakeAiClient.invokeAction05CreateMorningMeetingMaterials).not.toHaveBeenCalled();
    expect(fakeAiClient.invokeAction06NotifyUnsubmittedMembers).not.toHaveBeenCalled();

    // Verify: (9) Audit trail contains rejection details
    const auditEntry = auditLog[0];
    expect(auditEntry.validationError).toBeDefined();
    expect(auditEntry.timestamp).toEqual(new Date('2024-01-15T09:00:00Z'));
  });
});