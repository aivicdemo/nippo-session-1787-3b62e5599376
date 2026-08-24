import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type {
  Tx7Imp1AgentInput,
  Tx7Imp1AgentOutput,
} from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-3198
  test('Action 8手前で意図的にエラーが発生した場合、部分的に完了した副作用をすべて巻き戻すか補償する', async () => {
    // Arrange: fake AI client を初期化し、Tx7Imp1AiClient インターフェースに合致させる
    const fakeAiClient = {
      executeAction01: jest.fn(async () => ({
        status: 'success',
        timestamp: new Date('2024-01-01T09:00:00Z'),
      })),
      executeAction02: jest.fn(async () => ({
        status: 'success',
        datasetId: 'dataset-2024-01',
        recordCount: 250,
      })),
      executeAction03: jest.fn(async () => ({
        status: 'success',
        reportId: 'report-2024-01-001',
        reportPath: '/tmp/report-2024-01-001.pdf',
      })),
      executeAction04: jest.fn(async () => ({
        status: 'success',
        analysisId: 'analysis-04-001',
        timeSeriesRecords: 31,
      })),
      executeAction05: jest.fn(async () => ({
        status: 'success',
        bottleneckDataId: 'bottleneck-05-001',
      })),
      executeAction06: jest.fn(async () => ({
        status: 'success',
        performanceFileId: 'perf-file-06-001',
        tempFilePath: '/tmp/performance-metrics.csv',
      })),
      executeAction07: jest.fn(async () => ({
        status: 'success',
        cacheEntryId: 'cache-07-001',
      })),
      executeAction08: jest.fn(async () => {
        // Action 8 で意図的にエラーを発生させる（データベース接続失敗）
        throw new Error('Database connection failed during report presentation');
      }),
      compensateAction07: jest.fn(async () => ({
        status: 'success',
        deletedCacheEntryId: 'cache-07-001',
      })),
      compensateAction06: jest.fn(async () => ({
        status: 'success',
        deletedTempFilePath: '/tmp/performance-metrics.csv',
      })),
      compensateAction05: jest.fn(async () => ({
        status: 'success',
        deletedBottleneckDataId: 'bottleneck-05-001',
      })),
      compensateAction04: jest.fn(async () => ({
        status: 'success',
        deletedAnalysisRecords: 31,
      })),
      compensateAction03: jest.fn(async () => ({
        status: 'success',
        reportStatus: 'DRAFT',
        deletedReportPath: '/tmp/report-2024-01-001.pdf',
      })),
      recordAuditLog: jest.fn(async () => ({
        logId: 'audit-log-001',
      })),
    };

    const input: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'manager-user-001',
      includeDetailedAnalysis: true,
    };

    // Act: Orchestrator を実行し、Action 8 でエラーが発生した場合の巻き戻し動作を検証
    const result = await runTx7Imp1Agent(input, fakeAiClient);

    // Assert: すべての補償トランザクションが実行されたことを検証
    expect(result.executionStatus).toBe('failure');
    expect(result.reportId).toBeDefined();

    // Action 1～7 が正常に実行されたことを確認
    expect(fakeAiClient.executeAction01).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.executeAction02).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.executeAction03).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.executeAction04).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.executeAction05).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.executeAction06).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.executeAction07).toHaveBeenCalledTimes(1);

    // Action 8 でエラーが発生したことを確認
    expect(fakeAiClient.executeAction08).toHaveBeenCalledTimes(1);

    // 補償トランザクション Action 7 が実行され、分析結果キャッシュが削除されたことを確認
    expect(fakeAiClient.compensateAction07).toHaveBeenCalledTimes(1);

    // 補償トランザクション Action 6 が実行され、チーム別パフォーマンス指標一時ファイルが削除されたことを確認
    expect(fakeAiClient.compensateAction06).toHaveBeenCalledTimes(1);

    // 補償トランザクション Action 5 が実行され、ボトルネック推移データが削除されたことを確認
    expect(fakeAiClient.compensateAction05).toHaveBeenCalledTimes(1);

    // 補償トランザクション Action 4 が実行され、時系列変化分析結果が削除されたことを確認
    expect(fakeAiClient.compensateAction04).toHaveBeenCalledTimes(1);

    // 補償トランザクション Action 3 が実行され、レポートが削除またはドラフト状態に戻されたことを確認
    expect(fakeAiClient.compensateAction03).toHaveBeenCalledTimes(1);

    // 監査ログが記録されたことを確認
    expect(fakeAiClient.recordAuditLog).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'Tx7Imp1 compensated',
        targetMonth: '2024-01',
        managerUserId: 'manager-user-001',
        errorMessage: expect.stringContaining(
          'Database connection failed during report presentation'
        ),
      })
    );

    // 最終状態を検証：システムが初期状態に復帰していることを確認
    expect(result).toEqual(
      expect.objectContaining({
        executionStatus: 'failure',
        analysisResultSummary: expect.objectContaining({
          topPriorityChallenges: [],
          bottleneckTrend: expect.objectContaining({
            timeSeriesData: [],
            improvementTrend: 'stable',
            recurringIssuePattern: [],
          }),
        }),
        deliveryTimestamp: expect.any(Date),
      })
    );
  });
});