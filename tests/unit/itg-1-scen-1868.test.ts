import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/types';

describe('月次課題傾向分析レポート生成エージェント', () => {
  // SCEN-1868: [edge] 月次課題傾向分析レポート生成処理の失敗時再試行制御 - 失敗原因がデータ抽出エラーである場合、原因特定が正確に記録される
  test('should handle data extraction error with precise root cause tracking and escalation after max retries', async () => {
    const agentExecutionId = 'exec-' + Math.random().toString(36).substring(2, 11);
    const triggerTimestamp = new Date('2024-01-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = 'mgr-001';

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    // モック AI クライアントのセットアップ: Action 2 (当月蓄積報告データ抽出) で
    // 『データベース接続タイムアウト』エラーを意図的に返す
    let attemptCount = 0;
    const mockAiClient = {
      executeAction01ExtractAndValidateSchedule: jest
        .fn()
        .mockResolvedValue({
          isScheduleValid: true,
          targetMonthStart: '2024-01-01T00:00:00Z',
          targetMonthEnd: '2024-01-31T23:59:59Z',
        }),
      executeAction02ExtractMonthlyData: jest.fn(async () => {
        attemptCount++;
        if (attemptCount <= 3) {
          throw new Error('DatabaseConnectionTimeout');
        }
        // 3回超えた場合（実際には到達しない）
        return {
          extractedReports: [],
          totalCount: 0,
        };
      }),
      executeAction03AnalyzeTimeSeries: jest.fn(),
      executeAction04AnalyzeBottleneck: jest.fn(),
      executeAction05CalculateTeamMetrics: jest.fn(),
      executeAction06GenerateReport: jest.fn(),
      executeAction07PrepareDelivery: jest.fn(),
      executeAction08RecordAuditAndEscalate: jest.fn(async (auditLog: any) => {
        // 監査ログが正確に記録されることを確認
        return { escalationId: 'esc-' + Math.random().toString(36).substring(2, 11) };
      }),
    };

    const auditLogs: any[] = [];
    const escalationQueue: any[] = [];

    // オーケストレータを呼び出す
    const result = await runTx7Imp1Agent(agentInput, mockAiClient as any);

    // Action 2 が3回呼び出されていることを検証
    expect(mockAiClient.executeAction02ExtractMonthlyData).toHaveBeenCalledTimes(3);

    // 結果が失敗ステータスであることを確認
    expect(result.executionStatus).toBe('failure');

    // Action 8 (監査・エスカレーション) が呼ばれていることを確認
    expect(mockAiClient.executeAction08RecordAuditAndEscalate).toHaveBeenCalled();

    // Action 8 に渡された監査ログの構造を検証
    const auditLogArg = mockAiClient.executeAction08RecordAuditAndEscalate.mock.calls[0][0];

    expect(auditLogArg).toHaveProperty('errorType');
    expect(auditLogArg.errorType).toBe('DataExtractionError');

    expect(auditLogArg).toHaveProperty('rootCause');
    expect(auditLogArg.rootCause).toBe('DatabaseConnectionTimeout');

    expect(auditLogArg).toHaveProperty('attemptCount');
    expect(auditLogArg.attemptCount).toBe(3);

    expect(auditLogArg).toHaveProperty('retryIntervals');
    expect(auditLogArg.retryIntervals).toEqual([3000, 10000, 30000]);

    expect(auditLogArg).toHaveProperty('escalationType');
    expect(auditLogArg.escalationType).toBe('DataExtractionFailure');

    expect(auditLogArg).toHaveProperty('timestamp');
    expect(typeof auditLogArg.timestamp).toBe('string');

    expect(auditLogArg).toHaveProperty('agentExecutionId');
    expect(typeof auditLogArg.agentExecutionId).toBe('string');

    // エスカレーション条件『データ抽出エラーまたは不整合が発生した場合』に該当することを確認
    expect(auditLogArg.escalationType).toBe('DataExtractionFailure');

    // 部長への報告待機キュー情報がレスポンスに含まれていることを確認
    expect(result).toHaveProperty('analysisResultSummary');
    // 失敗時の分析結果サマリーには、エスカレーション情報が含まれている
    expect(result.analysisResultSummary).toHaveProperty('escalationInfo');
    expect(result.analysisResultSummary.escalationInfo).toContain('DataExtractionError');
    expect(result.analysisResultSummary.escalationInfo).toContain('DatabaseConnectionTimeout');
    expect(result.analysisResultSummary.escalationInfo).toContain('3回');
  });
});