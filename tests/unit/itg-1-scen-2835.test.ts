import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード - 本日の報告提出状況リアルタイム表示', () => {
  // SCEN-2835: [edge] 未提出メンバー優先度判定機能 - 最大人数規模（チーム全員が未提出）のメンバーリストが優先度順に完全に表示される
  test('チーム全員10名が未提出のとき、未提出経過時間が長い順にすべてのメンバーが表示される', () => {
    const now = new Date('2024-01-15T09:00:00Z');
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const teamId = 'team-001';
    const executorUserId = 'user-lead-001';

    const memberD_unsubmittedSince = new Date('2024-01-15T06:00:00Z'); // 180分未提出
    const memberF_unsubmittedSince = new Date('2024-01-15T06:30:00Z'); // 150分未提出
    const memberJ_unsubmittedSince = new Date('2024-01-15T06:45:00Z'); // 135分未提出
    const memberA_unsubmittedSince = new Date('2024-01-15T07:00:00Z'); // 120分未提出
    const memberI_unsubmittedSince = new Date('2024-01-15T07:15:00Z'); // 105分未提出
    const memberB_unsubmittedSince = new Date('2024-01-15T07:30:00Z'); // 90分未提出
    const memberH_unsubmittedSince = new Date('2024-01-15T07:45:00Z'); // 75分未提出
    const memberC_unsubmittedSince = new Date('2024-01-15T08:00:00Z'); // 60分未提出
    const memberE_unsubmittedSince = new Date('2024-01-15T08:15:00Z'); // 45分未提出
    const memberG_unsubmittedSince = new Date('2024-01-15T08:30:00Z'); // 30分未提出

    const input: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: '',
        status: 'sent' as const,
        sentAt: now,
        errorMessage: null,
      }),
    };

    const mockReportSubmissionStatusRepository = {
      findUnsubmittedMembers: jest.fn().mockResolvedValue([
        {
          userId: 'user-member-D',
          userName: 'メンバーD',
          email: 'member-d@company.com',
          unsubmittedSinceTime: memberD_unsubmittedSince,
          remainingMinutes: -180,
        },
        {
          userId: 'user-member-F',
          userName: 'メンバーF',
          email: 'member-f@company.com',
          unsubmittedSinceTime: memberF_unsubmittedSince,
          remainingMinutes: -150,
        },
        {
          userId: 'user-member-J',
          userName: 'メンバーJ',
          email: 'member-j@company.com',
          unsubmittedSinceTime: memberJ_unsubmittedSince,
          remainingMinutes: -135,
        },
        {
          userId: 'user-member-A',
          userName: 'メンバーA',
          email: 'member-a@company.com',
          unsubmittedSinceTime: memberA_unsubmittedSince,
          remainingMinutes: -120,
        },
        {
          userId: 'user-member-I',
          userName: 'メンバーI',
          email: 'member-i@company.com',
          unsubmittedSinceTime: memberI_unsubmittedSince,
          remainingMinutes: -105,
        },
        {
          userId: 'user-member-B',
          userName: 'メンバーB',
          email: 'member-b@company.com',
          unsubmittedSinceTime: memberB_unsubmittedSince,
          remainingMinutes: -90,
        },
        {
          userId: 'user-member-H',
          userName: 'メンバーH',
          email: 'member-h@company.com',
          unsubmittedSinceTime: memberH_unsubmittedSince,
          remainingMinutes: -75,
        },
        {
          userId: 'user-member-C',
          userName: 'メンバーC',
          email: 'member-c@company.com',
          unsubmittedSinceTime: memberC_unsubmittedSince,
          remainingMinutes: -60,
        },
        {
          userId: 'user-member-E',
          userName: 'メンバーE',
          email: 'member-e@company.com',
          unsubmittedSinceTime: memberE_unsubmittedSince,
          remainingMinutes: -45,
        },
        {
          userId: 'user-member-G',
          userName: 'メンバーG',
          email: 'member-g@company.com',
          unsubmittedSinceTime: memberG_unsubmittedSince,
          remainingMinutes: -30,
        },
      ]),
    };

    const mockReminderNotificationHistoryRepository = {
      recordSentNotification: jest.fn().mockResolvedValue(undefined),
    };

    const result = detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationServiceAdapter,
      mockReportSubmissionStatusRepository,
      mockReminderNotificationHistoryRepository,
      now,
    );

    expect(result).resolves.toMatchObject({
      unsubmittedMembers: expect.arrayContaining([
        expect.objectContaining({
          userId: 'user-member-D',
          userName: 'メンバーD',
          email: 'member-d@company.com',
          remainingMinutes: -180,
        }),
        expect.objectContaining({
          userId: 'user-member-F',
          userName: 'メンバーF',
          email: 'member-f@company.com',
          remainingMinutes: -150,
        }),
        expect.objectContaining({
          userId: 'user-member-J',
          userName: 'メンバーJ',
          email: 'member-j@company.com',
          remainingMinutes: -135,
        }),
        expect.objectContaining({
          userId: 'user-member-A',
          userName: 'メンバーA',
          email: 'member-a@company.com',
          remainingMinutes: -120,
        }),
        expect.objectContaining({
          userId: 'user-member-I',
          userName: 'メンバーI',
          email: 'member-i@company.com',
          remainingMinutes: -105,
        }),
        expect.objectContaining({
          userId: 'user-member-B',
          userName: 'メンバーB',
          email: 'member-b@company.com',
          remainingMinutes: -90,
        }),
        expect.objectContaining({
          userId: 'user-member-H',
          userName: 'メンバーH',
          email: 'member-h@company.com',
          remainingMinutes: -75,
        }),
        expect.objectContaining({
          userId: 'user-member-C',
          userName: 'メンバーC',
          email: 'member-c@company.com',
          remainingMinutes: -60,
        }),
        expect.objectContaining({
          userId: 'user-member-E',
          userName: 'メンバーE',
          email: 'member-e@company.com',
          remainingMinutes: -45,
        }),
        expect.objectContaining({
          userId: 'user-member-G',
          userName: 'メンバーG',
          email: 'member-g@company.com',
          remainingMinutes: -30,
        }),
      ]),
      notificationsSent: 10,
    });

    result.then((output: DetectUnsubmittedMembersOutput) => {
      expect(output.unsubmittedMembers).toHaveLength(10);
      expect(output.unsubmittedMembers[0].remainingMinutes).toBe(-180);
      expect(output.unsubmittedMembers[1].remainingMinutes).toBe(-150);
      expect(output.unsubmittedMembers[2].remainingMinutes).toBe(-135);
      expect(output.unsubmittedMembers[3].remainingMinutes).toBe(-120);
      expect(output.unsubmittedMembers[4].remainingMinutes).toBe(-105);
      expect(output.unsubmittedMembers[5].remainingMinutes).toBe(-90);
      expect(output.unsubmittedMembers[6].remainingMinutes).toBe(-75);
      expect(output.unsubmittedMembers[7].remainingMinutes).toBe(-60);
      expect(output.unsubmittedMembers[8].remainingMinutes).toBe(-45);
      expect(output.unsubmittedMembers[9].remainingMinutes).toBe(-30);
      expect(output.notificationsSent).toBe(10);
    });
  });
});