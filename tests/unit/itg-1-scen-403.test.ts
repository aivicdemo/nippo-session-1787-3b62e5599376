import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー追跡と通知機能', () => {
  // SCEN-403
  test('未提出メンバー一覧の生成機能 - 未提出メンバーが1人の場合、そのメンバー情報が一覧に含まれる', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T09:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({}),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent: 9,
        failed: 0,
        pending: 0,
      }),
    };

    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'user-manager-001',
    };

    const mockSubmittedMembers = [
      { userId: 'user-001', userName: 'Alice', email: 'alice@example.com', submittedAt: new Date('2024-01-15T08:45:00Z') },
      { userId: 'user-002', userName: 'Bob', email: 'bob@example.com', submittedAt: new Date('2024-01-15T08:50:00Z') },
      { userId: 'user-003', userName: 'Charlie', email: 'charlie@example.com', submittedAt: new Date('2024-01-15T08:55:00Z') },
      { userId: 'user-004', userName: 'Diana', email: 'diana@example.com', submittedAt: new Date('2024-01-15T09:00:00Z') },
      { userId: 'user-005', userName: 'Eve', email: 'eve@example.com', submittedAt: new Date('2024-01-15T08:40:00Z') },
      { userId: 'user-006', userName: 'Frank', email: 'frank@example.com', submittedAt: new Date('2024-01-15T08:35:00Z') },
      { userId: 'user-007', userName: 'Grace', email: 'grace@example.com', submittedAt: new Date('2024-01-15T08:30:00Z') },
      { userId: 'user-008', userName: 'Henry', email: 'henry@example.com', submittedAt: new Date('2024-01-15T08:25:00Z') },
      { userId: 'user-009', userName: 'Ivy', email: 'ivy@example.com', submittedAt: new Date('2024-01-15T08:20:00Z') },
    ];

    const unsubmittedMember = {
      userId: 'user-010',
      userName: 'Jack',
      email: 'jack@example.com',
    };

    const allTeamMembers = [
      ...mockSubmittedMembers,
      unsubmittedMember,
    ];

    const mockDataRepository = {
      getTeamMembers: jest.fn().mockResolvedValue(allTeamMembers),
      getSubmittedReports: jest.fn().mockResolvedValue(mockSubmittedMembers),
      recordNotificationSent: jest.fn().mockResolvedValue({}),
    };

    const result = detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationServiceAdapter,
      mockDataRepository,
    );

    return result.then((output: DetectUnsubmittedMembersOutput) => {
      expect(output.unsubmittedMembers).toHaveLength(1);
      expect(output.unsubmittedMembers[0]).toEqual({
        userId: 'user-010',
        userName: 'Jack',
        email: 'jack@example.com',
      });
      expect(output.notificationsSent).toBe(1);
      expect(output.notificationFailures).toHaveLength(0);
      expect(output.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });
  });
});