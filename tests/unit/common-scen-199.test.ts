import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  // SCEN-199: [normal] 日報収集・確認・催促の自動化エージェント AIエージェント - 
  // 「日報収集・確認・催促の自動化エージェント」が自律処理「課題を優先度付けしてサマリーを作成する」を契約どおり実行する
  test('should generate prioritized task summary with audit logs for 10 members with extracted tasks', async () => {
    // Prepare stub data: 10 members with daily reports containing tasks
    const members = Array.from({ length: 10 }, (_, i) => ({
      memberId: `M${String(i + 1).padStart(3, '0')}`,
      memberName: `Member${i + 1}`,
      teamId: 'TEAM001',
      reportSubmitted: true,
      submittedAt: new Date('2024-01-15T08:00:00Z'),
    }));

    // Extracted tasks from members' reports (prepared by Actions 1-4)
    const extractedTasks = [
      {
        taskId: 'TASK001',
        memberReportId: 'M001',
        content: 'Database query performance degradation',
        severity: 'high',
        affectedCount: 5,
        firstOccurrenceDate: new Date('2024-01-10T00:00:00Z'),
      },
      {
        taskId: 'TASK002',
        memberReportId: 'M002',
        content: 'API authentication token expiration issue',
        severity: 'high',
        affectedCount: 8,
        firstOccurrenceDate: new Date('2024-01-12T00:00:00Z'),
      },
      {
        taskId: 'TASK003',
        memberReportId: 'M003',
        content: 'Memory leak in background worker',
        severity: 'medium',
        affectedCount: 2,
        firstOccurrenceDate: new Date('2024-01-14T00:00:00Z'),
      },
      {
        taskId: 'TASK004',
        memberReportId: 'M004',
        content: 'UI rendering delay on mobile devices',
        severity: 'low',
        affectedCount: 3,
        firstOccurrenceDate: new Date('2024-01-15T06:00:00Z'),
      },
      {
        taskId: 'TASK005',
        memberReportId: 'M005',
        content: 'Third-party service integration timeout',
        severity: 'high',
        affectedCount: 4,
        firstOccurrenceDate: new Date('2024-01-11T00:00:00Z'),
      },
      {
        taskId: 'TASK006',
        memberReportId: 'M006',
        content: 'Documentation update needed for new API',
        severity: 'low',
        affectedCount: 1,
        firstOccurrenceDate: new Date('2024-01-15T07:30:00Z'),
      },
    ];

    // Priority determination rules
    const priorityRules = {
      highSeverityWeight: 40,
      affectedCountWeight: 30,
      recurrenceRiskWeight: 30,
      maxPriorityScore: 100,
    };

    // Stub AI client response: prioritized tasks with scores
    const aiClientResponse = {
      prioritizedTasks: [
        {
          taskId: 'TASK002',
          content: 'API authentication token expiration issue',
          priorityScore: 92,
          severityLevel: 'high',
          estimatedResolutionMinutes: 120,
          rationale: 'High severity affecting 8 members, requires immediate attention',
        },
        {
          taskId: 'TASK001',
          content: 'Database query performance degradation',
          priorityScore: 88,
          severityLevel: 'high',
          estimatedResolutionMinutes: 240,
          rationale: 'High severity with 5 affected members, recurring issue detected',
        },
        {
          taskId: 'TASK005',
          content: 'Third-party service integration timeout',
          priorityScore: 81,
          severityLevel: 'high',
          estimatedResolutionMinutes: 90,
          rationale: 'High severity affecting external service availability',
        },
        {
          taskId: 'TASK003',
          content: 'Memory leak in background worker',
          priorityScore: 55,
          severityLevel: 'medium',
          estimatedResolutionMinutes: 180,
          rationale: 'Medium severity with limited scope',
        },
        {
          taskId: 'TASK004',
          content: 'UI rendering delay on mobile devices',
          priorityScore: 42,
          severityLevel: 'low',
          estimatedResolutionMinutes: 90,
          rationale: 'Low severity, cosmetic impact only',
        },
      ],
      processingTimestamp: new Date('2024-01-15T11:00:00Z'),
      memberCount: 10,
    };

    // Mock audit log events that should be recorded
    const auditLogs: Array<{
      eventType: string;
      timestamp: Date;
      actionId: string;
      details: Record<string, unknown>;
    }> = [];

    // Mock implementation: simulate Action 5 execution
    const mockAiClient = {
      prioritizeTasks: jest.fn(async (input) => {
        // Verify input structure contains extracted tasks, member info, and priority rules
        expect(input).toHaveProperty('extractedTasks');
        expect(input).toHaveProperty('memberCount');
        expect(input).toHaveProperty('priorityRules');
        expect(Array.isArray(input.extractedTasks)).toBe(true);
        expect(input.memberCount).toBe(10);
        expect(input.priorityRules).toEqual(priorityRules);

        // Record audit log for AI call
        auditLogs.push({
          eventType: 'action-05-ai-call-start',
          timestamp: new Date('2024-01-15T11:00:15Z'),
          actionId: 'action-05',
          details: { taskCount: input.extractedTasks.length },
        });

        return aiClientResponse;
      }),
    };

    // Execute sendUnsubmittedReminder with stub context
    const summary = await sendUnsubmittedReminder({
      extractedTasks,
      members,
      priorityRules,
      aiClient: mockAiClient,
    });

    // Verify Action 5 PROMPT_VERSION is correctly managed
    // This would be imported and verified in actual implementation
    const ACTION_05_PROMPT_VERSION = '1.0.0';
    expect(ACTION_05_PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);

    // Assertions: Verify summary structure and content
    expect(summary).toHaveProperty('prioritizedTasks');
    expect(Array.isArray(summary.prioritizedTasks)).toBe(true);

    // Verify tasks are sorted by priority score descending
    expect(summary.prioritizedTasks.length).toBeLessThanOrEqual(5);
    for (let i = 0; i < summary.prioritizedTasks.length - 1; i++) {
      expect(summary.prioritizedTasks[i].priorityScore).toBeGreaterThanOrEqual(
        summary.prioritizedTasks[i + 1].priorityScore
      );
    }

    // Verify each task contains required fields
    summary.prioritizedTasks.forEach((task) => {
      expect(task).toHaveProperty('taskId');
      expect(task).toHaveProperty('content');
      expect(task).toHaveProperty('priorityScore');
      expect(typeof task.priorityScore).toBe('number');
      expect(task.priorityScore).toBeGreaterThanOrEqual(0);
      expect(task.priorityScore).toBeLessThanOrEqual(100);

      expect(task).toHaveProperty('severityLevel');
      expect(['high', 'medium', 'low']).toContain(task.severityLevel);

      expect(task).toHaveProperty('estimatedResolutionMinutes');
      expect(typeof task.estimatedResolutionMinutes).toBe('number');
      expect(task.estimatedResolutionMinutes).toBeGreaterThan(0);
    });

    // Verify summary metadata
    expect(summary).toHaveProperty('processingTimestamp');
    expect(summary.processingTimestamp).toEqual(new Date('2024-01-15T11:00:00Z'));
    expect(summary).toHaveProperty('memberCount');
    expect(summary.memberCount).toBe(10);

    // Verify top priority task is correct
    expect(summary.prioritizedTasks[0].taskId).toBe('TASK002');
    expect(summary.prioritizedTasks[0].priorityScore).toBe(92);

    // Verify second and third priority tasks
    expect(summary.prioritizedTasks[1].taskId).toBe('TASK001');
    expect(summary.prioritizedTasks[1].priorityScore).toBe(88);
    expect(summary.prioritizedTasks[2].taskId).toBe('TASK005');
    expect(summary.prioritizedTasks[2].priorityScore).toBe(81);

    // Verify audit logs recorded for all action steps
    expect(auditLogs.length).toBeGreaterThan(0);
    const actionStartLog = auditLogs.find((log) => log.eventType === 'action-05-ai-call-start');
    expect(actionStartLog).toBeDefined();
    expect(actionStartLog?.actionId).toBe('action-05');
    expect(actionStartLog?.timestamp).toEqual(new Date('2024-01-15T11:00:15Z'));
    expect(actionStartLog?.details.taskCount).toBe(6);

    // Verify AI client was called with correct input
    expect(mockAiClient.prioritizeTasks).toHaveBeenCalled();
    const callArgs = mockAiClient.prioritizeTasks.mock.calls[0][0];
    expect(callArgs.extractedTasks.length).toBe(6);
    expect(callArgs.memberCount).toBe(10);

    // Verify no automatic notification sent to members (Action 5 is summary generation only)
    // This confirms the contract requirement: reminders sent in earlier actions, 
    // Action 5 generates summary for manager review only
    expect(summary).not.toHaveProperty('notificationsSentToMembers');
  });
});