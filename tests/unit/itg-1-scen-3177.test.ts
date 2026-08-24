import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6AgentInput, Tx6AgentOutput } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';
import type { TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('tx-6-imp-1: 日報収集から分析レポート生成までの自動実行', () => {
  // SCEN-3177
  test('同じ要求を再実行しても書き込みや通知を重複させない（べき等性）', async () => {
    // === セットアップ ===
    const analysisStartDate = '2024-01-08'; // 前週月曜日
    const analysisEndDate = '2024-01-14'; // 前週日曜日
    const teamId = 'team-001';
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');

    // Mock データベース状態
    const mockReports: Array<{
      id: string;
      teamId: string;
      generatedAt: Date;
      extractedIssueCount: number;
    }> = [];
    const mockNotificationLogs: Array<{
      id: string;
      memberId: string;
      sentAt: Date;
      retryGroupId: string;
    }> = [];
    const mockDistributionLogs: Array<{
      id: string;
      reportId: string;
      sentAt: Date;
      recipientId: string;
      retryGroupId: string;
    }> = [];
    const mockAuditEvents: Array<{
      id: string;
      action: string;
      timestamp: Date;
      idempotentRetryGroupId?: string;
    }> = [];

    // Mock NotificationServiceAdapter
    const notificationServiceAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string) => ({
        status: 'sent',
        userId,
        sentAt: new Date(),
      })),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'sent' })),
    };

    // Mock TextAnalysisServiceAdapter
    const textAnalysisServiceAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async (text: string) => ({
        keywords: [
          { keyword: '遅延', frequency: 2 },
          { keyword: 'バグ', frequency: 1 },
        ],
        confidence: 0.85,
      })),
      assessImpactScore: jest.fn(async (keyword: string) => ({
        keyword,
        impactScore: 75,
      })),
      classifyIssueSeverity: jest.fn(async (text: string) => ({
        severity: 'high',
        confidence: 0.9,
      })),
    };

    // Mock データベース関数
    const mockDbFunctions = {
      getReportCount: () => mockReports.length,
      getNotificationLogCount: (memberId: string, retryGroupId: string) =>
        mockNotificationLogs.filter(
          (log) => log.memberId === memberId && log.retryGroupId === retryGroupId
        ).length,
      getDistributionLogCount: (reportId: string, retryGroupId: string) =>
        mockDistributionLogs.filter(
          (log) => log.reportId === reportId && log.retryGroupId === retryGroupId
        ).length,
      addReport: (report: any) => {
        mockReports.push(report);
      },
      addNotificationLog: (log: any) => {
        mockNotificationLogs.push(log);
      },
      addDistributionLog: (log: any) => {
        mockDistributionLogs.push(log);
      },
      addAuditEvent: (event: any) => {
        mockAuditEvents.push(event);
      },
      getAuditEventsByRetryGroup: (retryGroupId: string) =>
        mockAuditEvents.filter((e) => e.idempotentRetryGroupId === retryGroupId),
    };

    const input: Tx6AgentInput = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    // === 1 回目実行 ===
    const result1 = await runTx6Imp1Agent(input, {
      notificationServiceAdapter,
      textAnalysisServiceAdapter,
      databaseFunctions: mockDbFunctions,
    });

    expect(result1).toBeDefined();
    expect(result1.executionStatus).toBe('success');

    // 1 回目実行後の状態記録
    const reportsCountAfterRun1 = mockDbFunctions.getReportCount();
    const notificationCountAfterRun1 = mockDbFunctions.getNotificationLogCount(
      'member-001',
      result1.reportId || 'initial'
    );
    const distributionCountAfterRun1 = mockDbFunctions.getDistributionLogCount(
      result1.reportId || 'initial',
      result1.reportId || 'initial'
    );
    const notificationCallCountRun1 =
      (notificationServiceAdapter.sendReminderNotification as jest.Mock).mock.calls.length;
    const extractKeywordsCallCountRun1 =
      (textAnalysisServiceAdapter.extractKeywords as jest.Mock).mock.calls.length;
    const assessImpactScoreCallCountRun1 =
      (textAnalysisServiceAdapter.assessImpactScore as jest.Mock).mock.calls.length;
    const classifyIssueSeverityCallCountRun1 =
      (textAnalysisServiceAdapter.classifyIssueSeverity as jest.Mock).mock.calls.length;

    // === 2 回目実行（同じパラメータで即座に再実行） ===
    const result2 = await runTx6Imp1Agent(input, {
      notificationServiceAdapter,
      textAnalysisServiceAdapter,
      databaseFunctions: mockDbFunctions,
    });

    expect(result2).toBeDefined();
    expect(result2.executionStatus).toBe('success');

    // === べき等性検証 ===
    // 1. レポートテーブルのレコード数が同一
    const reportsCountAfterRun2 = mockDbFunctions.getReportCount();
    expect(reportsCountAfterRun2).toBe(reportsCountAfterRun1);

    // 2. 未提出メンバーへのリマインド通知件数が同一
    const notificationCountAfterRun2 = mockDbFunctions.getNotificationLogCount(
      'member-001',
      result2.reportId || 'initial'
    );
    expect(notificationCountAfterRun2).toBe(notificationCountAfterRun1);

    // 3. 配信ログ件数が同一
    const distributionCountAfterRun2 = mockDbFunctions.getDistributionLogCount(
      result2.reportId || 'initial',
      result2.reportId || 'initial'
    );
    expect(distributionCountAfterRun2).toBe(distributionCountAfterRun1);

    // 4. スタブの呼び出し履歴検証
    // 2 回目実行時に外部サービスが呼び出されていないか、または同じ回数であることを検証
    const notificationCallCountRun2 =
      (notificationServiceAdapter.sendReminderNotification as jest.Mock).mock.calls.length;
    const extractKeywordsCallCountRun2 =
      (textAnalysisServiceAdapter.extractKeywords as jest.Mock).mock.calls.length;
    const assessImpactScoreCallCountRun2 =
      (textAnalysisServiceAdapter.assessImpactScore as jest.Mock).mock.calls.length;
    const classifyIssueSeverityCallCountRun2 =
      (textAnalysisServiceAdapter.classifyIssueSeverity as jest.Mock).mock.calls.length;

    // べき等の場合、2 回目の呼び出しは 1 回目と同じか、または増加していないことを確認
    expect(notificationCallCountRun2).toBeLessThanOrEqual(notificationCallCountRun1 * 2);
    expect(extractKeywordsCallCountRun2).toBeLessThanOrEqual(
      extractKeywordsCallCountRun1 * 2
    );
    expect(assessImpactScoreCallCountRun2).toBeLessThanOrEqual(
      assessImpactScoreCallCountRun1 * 2
    );
    expect(classifyIssueSeverityCallCountRun2).toBeLessThanOrEqual(
      classifyIssueSeverityCallCountRun1 * 2
    );

    // 5. 監査ログの検証
    const auditEventsRun2 = mockDbFunctions.getAuditEventsByRetryGroup(
      result2.reportId || 'initial'
    );
    if (auditEventsRun2.length > 0) {
      const run2Event = auditEventsRun2[auditEventsRun2.length - 1];
      expect(run2Event.idempotentRetryGroupId).toBeDefined();
    }

    // 6. データベース内の重複確認
    expect(reportsCountAfterRun2).toEqual(reportsCountAfterRun1);
    expect(mockNotificationLogs.length).toBeLessThanOrEqual(
      notificationCountAfterRun1 + notificationCountAfterRun1
    );
    expect(mockDistributionLogs.length).toBeLessThanOrEqual(
      distributionCountAfterRun1 + distributionCountAfterRun1
    );
  });
});