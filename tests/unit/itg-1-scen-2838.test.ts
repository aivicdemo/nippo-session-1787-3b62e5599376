import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー優先度判定機能 - 同一日期限のエッジケース', () => {
  // SCEN-2838
  test('報告期限の開始日と終了日が同日の場合、未提出判定が正確に機能する', async () => {
    // Arrange
    const reportDate = '2026-08-20';
    const morningMeetingStartTime = '09:00';
    const teamId = 'team-001';
    const executorUserId = 'executor-user-001';

    const input: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    // Mock team members: 10 members total
    // 8 members have submitted, 2 members have not submitted
    const mockMembers = [
      { userId: 'member-001', userName: 'Taro Yamada', email: 'taro@example.com', submitted: true, submittedAt: new Date('2026-08-20T08:30:00Z') },
      { userId: 'member-002', userName: 'Hanako Suzuki', email: 'hanako@example.com', submitted: true, submittedAt: new Date('2026-08-20T08:45:00Z') },
      { userId: 'member-003', userName: 'Jiro Tanaka', email: 'jiro@example.com', submitted: true, submittedAt: new Date('2026-08-20T08:15:00Z') },
      { userId: 'member-004', userName: 'Yuki Nakamura', email: 'yuki@example.com', submitted: true, submittedAt: new Date('2026-08-20T07:50:00Z') },
      { userId: 'member-005', userName: 'Kenji Kobayashi', email: 'kenji@example.com', submitted: true, submittedAt: new Date('2026-08-20T08:00:00Z') },
      { userId: 'member-006', userName: 'Sachiko Ito', email: 'sachiko@example.com', submitted: true, submittedAt: new Date('2026-08-20T08:20:00Z') },
      { userId: 'member-007', userName: 'Noboru Yamamoto', email: 'noboru@example.com', submitted: true, submittedAt: new Date('2026-08-20T08:35:00Z') },
      { userId: 'member-008', userName: 'Akiko Watanabe', email: 'akiko@example.com', submitted: true, submittedAt: new Date('2026-08-20T08:40:00Z') },
      { userId: 'memberA', userName: 'Sakura Matsuda', email: 'sakura@example.com', submitted: false, submittedAt: null },
      { userId: 'memberB', userName: 'Daichi Kato', email: 'daichi@example.com', submitted: false, submittedAt: null },
    ];

    // Mock repository/database queries
    const mockTeamRepository = {
      findTeamMembers: jest.fn().mockResolvedValue(mockMembers),
      getTeamMemberCount: jest.fn().mockResolvedValue(10),
    };

    const mockReportRepository = {
      findSubmissionsByTeamAndDate: jest.fn().mockResolvedValue(
        mockMembers
          .filter(m => m.submitted)
          .map(m => ({
            userId: m.userId,
            teamId,
            reportDate,
            submittedAt: m.submittedAt,
          }))
      ),
    };

    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent', sentAt: new Date('2026-08-20T08:50:00Z') }),
    };

    // Act
    const result = await detectAndNotifyUnsubmittedMembers(
      input,
      mockTeamRepository,
      mockReportRepository,
      mockNotificationService
    );

    // Assert: Verify unsubmitted members are correctly identified
    expect(result.unsubmittedMembers).toHaveLength(2);
    expect(result.unsubmittedMembers.map(m => m.userId)).toContain('memberA');
    expect(result.unsubmittedMembers.map(m => m.userId)).toContain('memberB');

    // Assert: Verify unsubmitted member details
    const memberARecord = result.unsubmittedMembers.find(m => m.userId === 'memberA');
    expect(memberARecord).toBeDefined();
    expect(memberARecord?.userName).toBe('Sakura Matsuda');
    expect(memberARecord?.email).toBe('sakura@example.com');
    expect(memberARecord?.remainingMinutes).toBeLessThan(0); // Negative value indicates overdue

    const memberBRecord = result.unsubmittedMembers.find(m => m.userId === 'memberB');
    expect(memberBRecord).toBeDefined();
    expect(memberBRecord?.userName).toBe('Daichi Kato');
    expect(memberBRecord?.email).toBe('daichi@example.com');
    expect(memberBRecord?.remainingMinutes).toBeLessThan(0);

    // Assert: Verify notifications were sent
    expect(result.notificationsSent).toBe(2);
    expect(mockNotificationService.sendReminderNotification).toHaveBeenCalledTimes(2);

    // Assert: Verify no notification failures for this scenario
    expect(result.notificationFailures).toHaveLength(0);

    // Assert: Verify execution timestamp
    const executedAt = new Date(result.executedAt);
    expect(executedAt).toBeInstanceOf(Date);
    expect(executedAt.getTime()).toBeLessThanOrEqual(new Date().getTime() + 1000); // Allow 1s tolerance

    // Assert: Verify priority ordering consistency
    // Both unsubmitted members have the same priority since they're both late
    if (result.unsubmittedMembers.length === 2) {
      const memberAPriority = result.unsubmittedMembers[0];
      const memberBPriority = result.unsubmittedMembers[1];
      // Both should have similar remaining minutes (both overdue by approximately same time)
      expect(Math.abs(memberAPriority.remainingMinutes - memberBPriority.remainingMinutes)).toBeLessThanOrEqual(1);
    }

    // Assert: Verify same-day deadline logic does not cause date comparison issues
    // The result should handle dates without day-boundary confusion
    expect(result.unsubmittedMembers.every(m => m.userId && m.userName && m.email)).toBe(true);
  });
});

// Type definitions for test clarity
interface DetectUnsubmittedMembersInput {
  teamId: string;
  reportDate: string;
  morningMeetingStartTime: string;
  executorUserId: string;
}

interface UnsubmittedMember {
  userId: string;
  userName: string;
  email: string;
  remainingMinutes: number;
}

interface NotificationFailure {
  userId: string;
  failureReason: string;
}

interface DetectUnsubmittedMembersOutput {
  unsubmittedMembers: UnsubmittedMember[];
  notificationsSent: number;
  notificationFailures: NotificationFailure[];
  executedAt: string;
}