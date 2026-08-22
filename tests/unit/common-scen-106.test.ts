import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

const fetchMock = require('jest-fetch-mock');

describe('Notification Delivery - sendUnsubmittedReminder', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-106: [normal] 日報収集から分析レポート生成までの自動実行 AIエージェント - 通常案件を人の都度承認なしで最後まで完了
  test('should send reminder to unsubmitted members without human approval during weekly report collection cycle', async () => {
    const mockReportData = [
      {
        memberId: 'M001',
        memberName: 'Alice',
        submitted: true,
        submittedAt: '2024-01-08T07:30:00Z',
        yesterdayWork: 'Completed feature A',
        todayPlan: 'Start feature B',
        issues: 'None',
      },
      {
        memberId: 'M002',
        memberName: 'Bob',
        submitted: false,
        submittedAt: null,
        yesterdayWork: null,
        todayPlan: null,
        issues: null,
      },
      {
        memberId: 'M003',
        memberName: 'Carol',
        submitted: false,
        submittedAt: null,
        yesterdayWork: null,
        todayPlan: null,
        issues: null,
      },
      {
        memberId: 'M004',
        memberName: 'David',
        submitted: true,
        submittedAt: '2024-01-08T06:45:00Z',
        yesterdayWork: 'Fixed bug X',
        todayPlan: 'Review PR',
        issues: 'Performance issue on endpoint',
      },
      {
        memberId: 'M005',
        memberName: 'Eve',
        submitted: true,
        submittedAt: '2024-01-08T07:15:00Z',
        yesterdayWork: 'Documentation',
        todayPlan: 'Testing',
        issues: 'Need more time for testing',
      },
      {
        memberId: 'M006',
        memberName: 'Frank',
        submitted: false,
        submittedAt: null,
        yesterdayWork: null,
        todayPlan: null,
        issues: null,
      },
      {
        memberId: 'M007',
        memberName: 'Grace',
        submitted: true,
        submittedAt: '2024-01-08T07:00:00Z',
        yesterdayWork: 'Deployment',
        todayPlan: 'Monitoring',
        issues: 'Server memory usage high',
      },
      {
        memberId: 'M008',
        memberName: 'Henry',
        submitted: false,
        submittedAt: null,
        yesterdayWork: null,
        todayPlan: null,
        issues: null,
      },
      {
        memberId: 'M009',
        memberName: 'Ivy',
        submitted: true,
        submittedAt: '2024-01-08T06:50:00Z',
        yesterdayWork: 'Code review',
        todayPlan: 'Implementation',
        issues: 'Unclear requirements',
      },
      {
        memberId: 'M010',
        memberName: 'Jack',
        submitted: true,
        submittedAt: '2024-01-08T07:20:00Z',
        yesterdayWork: 'Testing',
        todayPlan: 'Bug fixes',
        issues: 'Critical bug found in module Y',
      },
    ];

    const unsubmittedMembers = mockReportData.filter((m) => !m.submitted);
    expect(unsubmittedMembers.length).toBe(4);
    expect(unsubmittedMembers.map((m) => m.memberId)).toEqual(['M002', 'M003', 'M006', 'M008']);

    const mockReminderPayload = {
      timestamp: '2024-01-08T08:00:00Z',
      unsubmittedCount: unsubmittedMembers.length,
      unsubmittedMembers: unsubmittedMembers.map((m) => ({
        memberId: m.memberId,
        memberName: m.memberName,
        email: `${m.memberName.toLowerCase()}@company.com`,
      })),
      reminderType: 'weekly_collection',
      escalationLevel: 'normal',
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        remindersSent: mockReminderPayload.unsubmittedMembers.length,
        failedReminders: [],
        auditTrail: {
          actionId: 'send_reminder_001',
          executedAt: '2024-01-08T08:00:05Z',
          executedBy: 'system',
          targetCount: mockReminderPayload.unsubmittedMembers.length,
        },
      }),
      { status: 200 }
    );

    const result = await sendUnsubmittedReminder({
      reportData: mockReportData,
      executionTime: new Date('2024-01-08T08:00:00Z'),
      reminderType: 'weekly_collection',
    });

    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.remindersSent).toBe(4);
    expect(result.failedReminders).toEqual([]);
    expect(result.auditTrail).toBeDefined();
    expect(result.auditTrail.targetCount).toBe(4);
    expect(result.auditTrail.executedAt).toEqual('2024-01-08T08:00:05Z');

    const fetchCall = fetchMock.mock.calls[0];
    expect(fetchCall).toBeDefined();
    expect(fetchCall[0]).toContain('/reminders/send');
    expect(fetchCall[1].method).toBe('POST');

    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.unsubmittedMembers.length).toBe(4);
    expect(requestBody.timestamp).toBe('2024-01-08T08:00:00Z');
    expect(requestBody.reminderType).toBe('weekly_collection');
  });
});