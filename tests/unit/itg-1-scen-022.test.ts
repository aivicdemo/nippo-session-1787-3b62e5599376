import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1 月次レポート生成エージェント', () => {
  // SCEN-022: 集約対象期間内の日報データが不完全で必須フィールドが欠落している場合、DataAggregationIncompleteExceptionがスローされる
  test('should throw DataAggregationIncompleteException when report data is incomplete with missing required fields', async () => {
    const aggregationPeriodStart = new Date('2024-01-01T00:00:00Z');
    const aggregationPeriodEnd = new Date('2024-01-31T23:59:59Z');
    const targetTeamIds = ['team-001', 'team-002'];
    const reportOutputFormat = '日報サマリー';
    const managerUserId = 'manager-user-001';

    const mockAiClient = {
      extractMonthlyReportData: jest.fn().mockResolvedValue({
        extractedReports: [
          {
            reportId: 'report-001',
            employeeId: 'emp-001',
            reportDate: '2024-01-15',
            yesterday: '昨日の実績',
            today: '今日の予定',
            issue: '課題内容'
          },
          {
            reportId: 'report-002',
            employeeId: 'emp-002',
            reportDate: '2024-01-16',
            yesterday: '',
            today: '今日の予定',
            issue: '課題内容'
          },
          {
            reportId: 'report-003',
            employeeId: 'emp-003',
            reportDate: '2024-01-17',
            yesterday: '昨日の実績',
            today: null,
            issue: '課題内容'
          },
          {
            reportId: 'report-004',
            employeeId: 'emp-004',
            reportDate: '2024-01-18',
            yesterday: '昨日の実績',
            today: '今日の予定',
            issue: null
          }
        ]
      }),
      validateReportQuality: jest.fn(),
      generateMonthlyAnalysisReport: jest.fn(),
      sendManagerConfirmationEmail: jest.fn()
    };

    const input = {
      aggregationPeriodStart,
      aggregationPeriodEnd,
      targetTeamIds,
      reportOutputFormat,
      managerUserId
    };

    await expect(() =>
      runTx7Imp1Agent(input, mockAiClient as any)
    ).rejects.toThrow(/月次データ集約が不完全です。報告提出率が基準を下回っています。/);

    expect(mockAiClient.generateMonthlyAnalysisReport).not.toHaveBeenCalled();
    expect(mockAiClient.validateReportQuality).not.toHaveBeenCalled();
    expect(mockAiClient.sendManagerConfirmationEmail).not.toHaveBeenCalled();
  });
});