import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー抽出機能 - 重複排除', () => {
  test('SCEN-2917: 重複するメンバーIDを含むデータセットから一意のメンバーのみ抽出される', async () => {
    // Arrange
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'user-exec-001';

    const unsubmittedMembersWithDuplicates = [
      {
        userId: 'member_001',
        userName: 'Alice',
        email: 'alice@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'member_002',
        userName: 'Bob',
        email: 'bob@example.com',
        remainingMinutes: 45,
      },
      {
        userId: 'member_001',
        userName: 'Alice',
        email: 'alice@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'member_003',
        userName: 'Charlie',
        email: 'charlie@example.com',
        remainingMinutes: 60,
      },
      {
        userId: 'member_002',
        userName: 'Bob',
        email: 'bob@example.com',
        remainingMinutes: 45,
      },
    ];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'skipped',
        sentAt: null,
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue({}),
      getDeliveryStatus: jest.fn().mockResolvedValue({}),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        frequency: [],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        score: 0,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'low',
      }),
    };

    // Act
    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate,
        morningMeetingStartTime,
        executorUserId,
      },
      mockNotificationServiceAdapter,
      mockTextAnalysisServiceAdapter,
      unsubmittedMembersWithDuplicates
    );

    // Assert
    expect(result.unsubmittedMembers).toHaveLength(3);

    const uniqueUserIds = result.unsubmittedMembers.map(member => member.userId);
    const uniqueUserIdSet = new Set(uniqueUserIds);
    expect(uniqueUserIdSet.size).toBe(3);

    expect(uniqueUserIds).toContain('member_001');
    expect(uniqueUserIds).toContain('member_002');
    expect(uniqueUserIds).toContain('member_003');

    const member001Count = uniqueUserIds.filter(id => id === 'member_001').length;
    const member002Count = uniqueUserIds.filter(id => id === 'member_002').length;
    const member003Count = uniqueUserIds.filter(id => id === 'member_003').length;

    expect(member001Count).toBe(1);
    expect(member002Count).toBe(1);
    expect(member003Count).toBe(1);
  });
});