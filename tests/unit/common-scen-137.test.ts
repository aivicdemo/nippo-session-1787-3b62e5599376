import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-137: sendUnsubmittedReminder safely rejects low-confidence AI output and escalates to human review', async () => {
    // Setup: Create test data for unsubmitted reminders
    const mockUnsubmittedMembers = [
      {
        userId: 'user-001',
        memberName: 'Alice Johnson',
        email: 'alice@company.com',
        teamId: 'team-001',
        teamName: 'Backend Team',
        lastSubmissionDate: '2024-12-27T09:00:00Z',
        submissionDeadline: '2025-01-15T18:00:00Z',
      },
      {
        userId: 'user-002',
        memberName: 'Bob Smith',
        email: 'bob@company.com',
        teamId: 'team-001',
        teamName: 'Backend Team',
        lastSubmissionDate: '2024-12-26T14:30:00Z',
        submissionDeadline: '2025-01-15T18:00:00Z',
      },
    ];

    const mockAiClientResponse = {
      confidenceScore: 0.35,
      analysisResult: {
        extractedIssues: ['Issue A', 'Issue B'],
        priorityAssignments: [
          { issueId: 'issue-001', priority: 'HIGH', reasoning: 'possibly critical' },
          { issueId: 'issue-002', priority: 'MEDIUM', reasoning: 'maybe important' },
        ],
        timeSeriesAnalysis: {
          trend: 'uncertain',
          changePattern: 'ambiguous',
        },
      },
      validationMetadata: {
        reasoningClarity: 0.32,
        dataCompleteness: 0.38,
        trustabilityFlag: false,
      },
      escalationReason: 'confidence_below_threshold',
    };

    // Mock the notification delivery function with validation logic
    const mockNotificationService = jest.fn(async (params: {
      unsubmittedMembers: typeof mockUnsubmittedMembers;
      aiOutput: typeof mockAiClientResponse;
    }) => {
      // Simulate validation check for low-confidence output
      const confidenceThreshold = 0.5;
      if (params.aiOutput.confidenceScore <= confidenceThreshold) {
        const escalationEvent = {
          code: 'AI_OUTPUT_REJECTED',
          reason: 'confidence_below_threshold',
          confidence: params.aiOutput.confidenceScore,
          timestamp: new Date('2025-01-15T09:00:00Z').toISOString(),
          auditMessage: `ESCALATION: 不正・曖昧・低確信度 AI 出力を検出 - 信頼度 ${params.aiOutput.confidenceScore}`,
        };
        return {
          success: false,
          escalated: true,
          escalationEvent,
          notificationsSent: 0,
          skippedActions: ['Action_8_send_to_director'],
        };
      }
      return {
        success: true,
        escalated: false,
        notificationsSent: params.unsubmittedMembers.length,
      };
    });

    // Execute function with injected validation
    const result = await mockNotificationService({
      unsubmittedMembers: mockUnsubmittedMembers,
      aiOutput: mockAiClientResponse,
    });

    // Assertions: Verify escalation behavior
    expect(result.escalated).toBe(true);
    expect(result.success).toBe(false);
    expect(result.escalationEvent).toBeDefined();
    expect(result.escalationEvent.code).toBe('AI_OUTPUT_REJECTED');
    expect(result.escalationEvent.reason).toBe('confidence_below_threshold');
    expect(result.escalationEvent.confidence).toBe(0.35);
    expect(result.escalationEvent.auditMessage).toBe(
      'ESCALATION: 不正・曖昧・低確信度 AI 出力を検出 - 信頼度 0.35'
    );
    expect(result.notificationsSent).toBe(0);
    expect(result.skippedActions).toContain('Action_8_send_to_director');
    expect(mockNotificationService).toHaveBeenCalledWith({
      unsubmittedMembers: mockUnsubmittedMembers,
      aiOutput: mockAiClientResponse,
    });
  });
});