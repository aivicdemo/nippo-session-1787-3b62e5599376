import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import { type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('部長向けダッシュボード - 本日の報告提出状況リアルタイム表示', () => {
  // SCEN-212
  test('集約メール送信の冪等性 - 同じ日報データで2回集約メール生成を実行した場合、同一の統一フォーマットメールが生成される', async () => {
    // 準備: 日報データセットを準備
    const submittedReport_1 = {
      reporterId: 'eng-001',
      reporterName: '田中太郎',
      submittedAt: '2024-01-15T08:45:00Z',
      challenges: ['納期調整が必要', '顧客要件の曖昧性']
    };

    const submittedReport_2 = {
      reporterId: 'eng-002',
      reporterName: '佐藤花子',
      submittedAt: '2024-01-15T08:30:00Z',
      challenges: ['ビルドツールの互換性問題']
    };

    const summaryInput: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-dev-001',
      reportDate: '2024-01-15',
      managerUserId: 'mgr-001',
      submittedReports: [submittedReport_1, submittedReport_2],
      unsubmittedMemberIds: ['eng-003', 'eng-004'],
      reportDeadlineTime: '09:00'
    };

    // スタブ化: NotificationServiceAdapter
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'delivered',
        deliveredAt: '2024-01-15T08:50:00Z'
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'sched-001'
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered'
      })
    };

    // スタブ化: TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '納期調整', frequency: 1, confidence: 0.95 },
          { keyword: 'ビルドツール', frequency: 1, confidence: 0.88 }
        ]
      }),
      assessImpactScore: jest.fn().mockImplementation((text: string) => {
        if (text.includes('納期調整')) {
          return Promise.resolve({ score: 75, severity: 'high' });
        }
        if (text.includes('ビルドツール')) {
          return Promise.resolve({ score: 65, severity: 'medium' });
        }
        return Promise.resolve({ score: 45, severity: 'low' });
      }),
      classifyIssueSeverity: jest.fn().mockImplementation((text: string) => {
        if (text.includes('納期') || text.includes('要件')) {
          return Promise.resolve('high');
        }
        if (text.includes('ビルド')) {
          return Promise.resolve('medium');
        }
        return Promise.resolve('low');
      })
    };

    // 1回目実行
    const firstResult: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(
      summaryInput,
      mockNotificationAdapter,
      mockTextAnalysisAdapter
    );

    // 1回目の結果を保存
    const firstEmailId = firstResult.emailId;
    const firstSentAt = firstResult.sentAt;
    const firstRecipientEmail = firstResult.recipientEmail;
    const firstIncludedIssueCount = firstResult.includedIssueCount;
    const firstSubmissionSummary = firstResult.submissionSummary;

    // モックをリセット（同一入力で同一レスポンスを返すように再設定）
    mockNotificationAdapter.sendReminderNotification.mockClear();
    mockNotificationAdapter.scheduleNotification.mockClear();
    mockNotificationAdapter.getDeliveryStatus.mockClear();
    mockTextAnalysisAdapter.extractKeywords.mockClear();
    mockTextAnalysisAdapter.assessImpactScore.mockClear();
    mockTextAnalysisAdapter.classifyIssueSeverity.mockClear();

    mockNotificationAdapter.sendReminderNotification.mockResolvedValue({
      status: 'delivered',
      deliveredAt: '2024-01-15T08:50:00Z'
    });
    mockTextAnalysisAdapter.extractKeywords.mockResolvedValue({
      keywords: [
        { keyword: '納期調整', frequency: 1, confidence: 0.95 },
        { keyword: 'ビルドツール', frequency: 1, confidence: 0.88 }
      ]
    });
    mockTextAnalysisAdapter.assessImpactScore.mockImplementation((text: string) => {
      if (text.includes('納期調整')) {
        return Promise.resolve({ score: 75, severity: 'high' });
      }
      if (text.includes('ビルドツール')) {
        return Promise.resolve({ score: 65, severity: 'medium' });
      }
      return Promise.resolve({ score: 45, severity: 'low' });
    });
    mockTextAnalysisAdapter.classifyIssueSeverity.mockImplementation((text: string) => {
      if (text.includes('納期') || text.includes('要件')) {
        return Promise.resolve('high');
      }
      if (text.includes('ビルド')) {
        return Promise.resolve('medium');
      }
      return Promise.resolve('low');
    });

    // 2回目実行
    const secondResult: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(
      summaryInput,
      mockNotificationAdapter,
      mockTextAnalysisAdapter
    );

    // 冪等性の検証
    // (1) メールID（同一入力なので生成ロジックが同じ結果を生成）
    expect(secondResult.emailId).toBe(firstEmailId);

    // (2) 送信時刻の差分が無視できる範囲（通常は同じシステムであれば冪等）
    const firstTime = new Date(firstSentAt).getTime();
    const secondTime = new Date(secondResult.sentAt).getTime();
    expect(Math.abs(secondTime - firstTime)).toBeLessThan(1000); // 1秒以内の誤差を許容

    // (3) 送信先メールアドレスが同一
    expect(secondResult.recipientEmail).toBe(firstRecipientEmail);

    // (4) 含まれた優先度付き課題件数が同一
    expect(secondResult.includedIssueCount).toBe(firstIncludedIssueCount);
    expect(secondResult.includedIssueCount).toBe(2); // 納期調整、ビルドツール

    // (5) 提出状況サマリーが完全に一致
    expect(secondResult.submissionSummary).toEqual(firstSubmissionSummary);
    expect(secondResult.submissionSummary.submittedCount).toBe(2);
    expect(secondResult.submissionSummary.unsubmittedCount).toBe(2);
    expect(secondResult.submissionSummary.submissionRate).toBe(50);
  });
});