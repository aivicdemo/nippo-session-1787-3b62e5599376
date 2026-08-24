import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8AgentInput, Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('TX-8 Imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-1926: [edge] 課題の再発パターン分析機能 - 過去29日分のデータ（30日未満）では課題グループ化が実行されない
  test('should skip issue grouping when analysis period is less than 30 days', async () => {
    // Setup: current time reference
    const currentDate = new Date('2026-09-18T10:00:00Z');
    const analysisStartDate = new Date('2026-08-21T00:00:00Z'); // 29 days ago
    const analysisEndDate = new Date('2026-09-18T23:59:59Z');

    // Calculate the exact number of days
    const daysDifference = Math.floor(
      (analysisEndDate.getTime() - analysisStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysDifference).toBe(28); // 29日間は、実際の差分は28日

    // Stub TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['データベース接続エラー'],
        occurrenceCount: 5,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 65,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    // Stub NotificationServiceAdapter
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'sent',
        sentAt: new Date().toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    // Mock database interface for issue grouping table
    const mockDatabaseAdapter = {
      queryIssueGroupings: jest.fn().mockResolvedValue([]),
      insertIssueGrouping: jest.fn().mockResolvedValue({ id: 'grouping-001' }),
      queryIssueData: jest.fn().mockResolvedValue([
        {
          issueKeyword: 'データベース接続エラー',
          reportedDate: '2026-08-21T09:00:00Z',
          occurrenceCount: 1,
        },
        {
          issueKeyword: 'データベース接続エラー',
          reportedDate: '2026-08-25T10:30:00Z',
          occurrenceCount: 1,
        },
        {
          issueKeyword: 'データベース接続エラー',
          reportedDate: '2026-09-10T14:15:00Z',
          occurrenceCount: 1,
        },
        {
          issueKeyword: 'データベース接続エラー',
          reportedDate: '2026-09-15T11:00:00Z',
          occurrenceCount: 1,
        },
        {
          issueKeyword: 'データベース接続エラー',
          reportedDate: '2026-09-18T08:45:00Z',
          occurrenceCount: 1,
        },
      ]),
      getSystemLog: jest.fn().mockResolvedValue([]),
      insertSystemLog: jest.fn().mockResolvedValue({ logId: 'log-001' }),
    };

    // Mock cache adapter
    const mockCacheAdapter = {
      getPreviousAnalysisResult: jest.fn().mockResolvedValue({
        reportId: 'prev-report-001',
        recurringIssuePatterns: [
          {
            issueKeyword: 'ネットワークタイムアウト',
            occurrenceCount: 3,
            timeSeriesPattern: '周期的',
            priorityScore: 72,
          },
        ],
        visualizationGraphs: [
          {
            graphType: '折れ線',
            title: '課題発生傾向',
            dataPoints: [
              { date: '2026-09-01', count: 2 },
              { date: '2026-09-08', count: 1 },
            ],
          },
        ],
        emailSentAt: '2026-09-10T09:00:00Z',
      }),
    };

    const input: Tx8AgentInput = {
      analysisStartDate: analysisStartDate.toISOString(),
      analysisEndDate: analysisEndDate.toISOString(),
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    // Execute agent with stubbed dependencies
    const result = await runTx8Imp1Agent(input, {
      textAnalysisService: mockTextAnalysisAdapter,
      notificationService: mockNotificationAdapter,
      database: mockDatabaseAdapter,
      cache: mockCacheAdapter,
    } as any);

    // Assertions
    // 1. Issue grouping should NOT be created
    expect(mockDatabaseAdapter.insertIssueGrouping).not.toHaveBeenCalled();

    // 2. System log should record skip message
    const logCalls = mockDatabaseAdapter.insertSystemLog.mock.calls;
    expect(logCalls.length).toBeGreaterThan(0);
    const skipLogCall = logCalls.find((call) =>
      call[0]?.message?.includes('30日未満')
    );
    expect(skipLogCall).toBeDefined();

    // 3. Result should contain previous cached analysis (if available)
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    
    // 4. Verify that cache was attempted to be retrieved
    expect(mockCacheAdapter.getPreviousAnalysisResult).toHaveBeenCalled();

    // 5. Verify the output structure matches Tx8AgentOutput type
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('recurringIssuePatterns');
    expect(result).toHaveProperty('visualizationGraphs');
    expect(result).toHaveProperty('emailSentAt');

    // 6. Verify analysis period boundary condition
    expect(daysDifference).toBeLessThan(30);

    // 7. Email should still be sent with cached/empty results
    expect(result.emailSentAt).toBeDefined();
    const sentAt = new Date(result.emailSentAt);
    expect(sentAt.getTime()).toBeGreaterThan(currentDate.getTime() - 60000); // within last minute
  });
});