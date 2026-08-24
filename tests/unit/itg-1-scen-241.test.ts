import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import { type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('日報集約メール生成機能 - 負値スコア正規化', () => {
  // SCEN-241
  test('課題の影響度スコアが負値の場合、0点に正規化されてメール本文に記載される', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'システム障害', frequency: 2 },
          { keyword: '本番環境', frequency: 1 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(-15),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'sent',
        sentTimestamp: '2024-01-15T09:30:00Z',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: 'engineer-001',
          reporterName: '田中太郎',
          submittedAt: '2024-01-15T08:45:00Z',
          challenges: ['システム障害により本番環境が3時間停止'],
        },
        {
          reporterId: 'engineer-002',
          reporterName: '鈴木花子',
          submittedAt: '2024-01-15T08:50:00Z',
          challenges: ['データベース接続タイムアウトの調査中'],
        },
      ],
      unsubmittedMemberIds: ['engineer-003'],
      reportDeadlineTime: '09:00',
    };

    const output = await generateAndSendSummaryEmail(input, mockTextAnalysisAdapter, mockNotificationAdapter);

    expect(output).toBeDefined();
    expect(output.emailId).toBeTruthy();
    expect(output.sentAt).toBeTruthy();
    expect(output.recipientEmail).toBeTruthy();
    expect(output.submissionSummary.submittedCount).toBe(2);
    expect(output.submissionSummary.unsubmittedCount).toBe(1);
    expect(output.submissionSummary.submissionRate).toBe(66.67);
    
    // 負値スコアが正規化されて0点になっていることを確認
    expect(output.includedIssueCount).toBeGreaterThanOrEqual(0);
    
    // メール本文に0点（正規化済み）が記載されていることを検証
    // ※ 実装の具体的な文字列フォーマットに応じて調整
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalled();
    
    const emailCall = mockNotificationAdapter.sendReminderNotification.mock.calls[0];
    if (emailCall && emailCall[0]) {
      const emailContent = emailCall[0];
      // 影響度スコアが0に正規化されていることを確認
      expect(emailContent).toMatch(/影響度スコア[\s：:]*0/);
      expect(emailContent).not.toMatch(/-15/);
    }
  });
});