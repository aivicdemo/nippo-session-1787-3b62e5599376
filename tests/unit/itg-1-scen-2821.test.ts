import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況をリアルタイム表示し、未提出メンバーを一目で把握できる機能', () => {
  // SCEN-2821: [error] 未提出メンバー優先度リスト取得 - メンバーの優先度スコアが負数のとき、エラーが発生する
  test('メンバーの優先度スコアが負数の場合、ValidationErrorをスロー', async () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'user-mgr-001',
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T09:00:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({}),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        frequency: [],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(0),
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    await expect(
      detectAndNotifyUnsubmittedMembers(
        input,
        mockNotificationServiceAdapter,
        mockTextAnalysisServiceAdapter
      )
    ).rejects.toThrow(/優先度スコア|スコア/);
  });
});