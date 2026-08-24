import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1 月次レポート生成エージェント', () => {
  // SCEN-1860
  test('部長IDが空文字列のとき、3回再試行後のエスカレーション処理でエラーが発生する', async () => {
    const input: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: '',
      includeDetailedAnalysis: true,
    };

    let assessImpactScoreCallCount = 0;

    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['ボトルネック', 'リスク'],
        frequencies: [5, 3],
      }),
      assessImpactScore: jest.fn().mockImplementation(() => {
        assessImpactScoreCallCount++;
        if (assessImpactScoreCallCount <= 3) {
          return Promise.reject(
            new Error('API timeout: Connection exceeded 30 seconds')
          );
        }
        return Promise.resolve([75, 45]);
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue(['high', 'medium']),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'notif-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'pending',
      }),
    };

    const mockReportDataExtractor = {
      extractMonthlyData: jest.fn().mockResolvedValue({
        teamId: 'team-001',
        reportCount: 25,
        issuesReported: [
          { id: 'issue-1', keyword: 'ボトルネック', frequency: 5 },
          { id: 'issue-2', keyword: 'リスク', frequency: 3 },
        ],
      }),
    };

    const error = await runTx7Imp1Agent(input, {
      aiClient: mockAiClient,
      notificationAdapter: mockNotificationAdapter,
      reportDataExtractor: mockReportDataExtractor,
    }).catch((err) => err);

    expect(error).toBeDefined();
    expect(error.message).toMatch(/部長ID|manager|empty/i);
    expect(assessImpactScoreCallCount).toBe(3);
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});