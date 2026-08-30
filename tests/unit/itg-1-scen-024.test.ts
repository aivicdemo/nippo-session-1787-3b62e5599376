import { runTx8Imp1Agent, Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('Tx8Imp1Agent - 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-024: [normal] 朝会報告管理システムから課題データを自動抽出し、再発パターンを時系列で分析して可視化レポートを生成し、部長に提示する
  test('should process normal input and generate visualization report with issue patterns', async () => {
    // Arrange: テスト入力の準備
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-31';
    const managerUserId = 'manager-001';

    const executionContext = {
      analysisStartDate,
      analysisEndDate,
      targetTeamIds: undefined,
      managerUserId,
    };

    // スタブAIクライアントの作成
    const fakeAiClient: Tx8Imp1AiClient = {
      aggregateReportsByPeriod: jest.fn().mockResolvedValue({
        totalReportCount: 30,
        reports: Array.from({ length: 30 }, (_, i) => ({
          reportId: `report-${i + 1}`,
          employeeId: `emp-${(i % 10) + 1}`,
          reportDate: new Date('2024-01-15'),
          yesterdayWork: `Yesterday work content ${i + 1}`,
          todayPlan: `Today plan content ${i + 1}`,
          issues: `Issue keyword A Issue keyword B Issue keyword C`,
        })),
      }),

      analyzeIssuePatternsByTimeRange: jest.fn().mockResolvedValue({
        recurrentPatterns: [
          {
            patternId: 'pattern-A',
            keyword: 'パターンA',
            occurrenceCount: 5,
            affectedMemberCount: 4,
            timeSeriesData: [
              { date: '2024-01-05', count: 1 },
              { date: '2024-01-12', count: 2 },
              { date: '2024-01-19', count: 1 },
              { date: '2024-01-26', count: 1 },
            ],
          },
          {
            patternId: 'pattern-B',
            keyword: 'パターンB',
            occurrenceCount: 4,
            affectedMemberCount: 3,
            timeSeriesData: [
              { date: '2024-01-08', count: 2 },
              { date: '2024-01-15', count: 1 },
              { date: '2024-01-22', count: 1 },
            ],
          },
          {
            patternId: 'pattern-C',
            keyword: 'パターンC',
            occurrenceCount: 3,
            affectedMemberCount: 2,
            timeSeriesData: [
              { date: '2024-01-10', count: 1 },
              { date: '2024-01-20', count: 1 },
              { date: '2024-01-28', count: 1 },
            ],
          },
        ],
        analysisCompletedAt: new Date('2024-02-01T10:00:00Z'),
        patternCount: 3,
      }),

      generateAndSendManagerConfirmationEmail: jest.fn().mockResolvedValue({
        emailSent: true,
        notificationTargetUserId: managerUserId,
        sentAt: new Date('2024-02-01T10:05:00Z'),
      }),

      generateVisualizationReport: jest.fn().mockResolvedValue({
        reportId: 'viz-report-' + Date.now(),
        reportUrl: 'https://reports.example.com/viz-report-' + Date.now(),
      }),
    };

    // Act: 関数実行
    const result = await runTx8Imp1Agent(executionContext, fakeAiClient);

    // Assert: 期待結果の検証
    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('success');
    expect(typeof result.visualizationReportId).toBe('string');
    expect(result.visualizationReportId).toMatch(/^[a-zA-Z0-9-]+$/);
    expect(result.managerNotificationSent).toBe(true);

    // issuePatternSummary の検証
    expect(result.issuePatternSummary).toBeDefined();
    expect(result.issuePatternSummary?.totalIssuesAnalyzed).toBe(30);
    expect(result.issuePatternSummary?.recurrentIssueCount).toBe(3);
    expect(result.issuePatternSummary?.bottleneckProgressionDetected).toBe(true);

    // スタブが正しく呼ばれたことを確認
    expect(fakeAiClient.aggregateReportsByPeriod).toHaveBeenCalledWith(
      analysisStartDate,
      analysisEndDate,
      undefined,
    );
    expect(fakeAiClient.analyzeIssuePatternsByTimeRange).toHaveBeenCalled();
    expect(fakeAiClient.generateAndSendManagerConfirmationEmail).toHaveBeenCalledWith(
      managerUserId,
      expect.any(Object),
    );
    expect(fakeAiClient.generateVisualizationReport).toHaveBeenCalled();
  });
});