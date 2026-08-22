import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-066: AI rejects low-confidence priority judgment and escalates to manual review', async () => {
    const mockAiClient = {
      judgeIssuePriority: jest.fn().mockResolvedValue({
        issues: [
          {
            id: 'issue-001',
            title: 'Database performance degradation',
            description: 'Query response time exceeded threshold',
            urgency: undefined,
            impactScope: undefined,
            confidenceScore: 0.45,
            priorityJustification: 'Unable to determine',
          },
        ],
        confidenceThreshold: 0.6,
        judgmentTimestamp: '2024-01-15T09:00:00Z',
      }),
    };

    const aggregatedReportData = {
      reportDate: '2024-01-15',
      submittedCount: 8,
      unsubmittedMembers: ['member-003', 'member-007'],
      issues: [
        {
          id: 'issue-001',
          title: 'Database performance degradation',
          description: 'Query response time exceeded threshold',
          reportedBy: 'member-001',
          reportedAt: '2024-01-15T08:15:00Z',
        },
      ],
    };

    const result = await sendUnsubmittedReminder(
      aggregatedReportData,
      mockAiClient
    );

    expect(result.status).toBe('ESCALATED');
    expect(result.escalationReason).toMatch(/確信度不足|0\.45/);
    expect(result.unhandledIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'issue-001',
          title: 'Database performance degradation',
        }),
      ])
    );
    expect(result.manualReviewRequired).toBe(true);
    expect(result.timestamp).toBeDefined();
    expect(result.requestId).toBeDefined();

    expect(mockAiClient.judgeIssuePriority).toHaveBeenCalledWith(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            id: 'issue-001',
          }),
        ]),
      })
    );

    expect(result.mailSent).toBe(false);
    expect(result.auditLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'AI_OUTPUT_REJECTED',
          reason: 'LOW_CONFIDENCE',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      ])
    );
  });
});