import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成 - 失敗時再試行制御', () => {
  // SCEN-1867
  test('月次レポート生成処理がタイムアウトで失敗する場合、再試行制御が動作し監査ログに正確に記録される', async () => {
    // Setup: タイムアウト失敗をシミュレートするfake AI client
    const auditLogs: Array<{
      failureReason: string;
      retryAttempts: number;
      retryIntervals: number[];
      timeoutThreshold: number;
      escalationTriggered: boolean;
      alertType: string;
      initialAttemptTimestamp: Date;
      finalAttemptTimestamp: Date;
    }> = [];

    const fakeAiClient: Tx7Imp1AiClient = {
      action01ExtractMonthlyData: async () => {
        throw new Error('Operation timed out after 30000ms');
      },
      action02AggregateIssueData: async () => {
        throw new Error('Operation timed out after 30000ms');
      },
      action03AnalyzeTimeSeries: async () => {
        throw new Error('Operation timed out after 30000ms');
      },
      action04IdentifyBottleneckTrend: async () => {
        throw new Error('Operation timed out after 30000ms');
      },
      action05CalculateTeamMetrics: async () => {
        throw new Error('Operation timed out after 30000ms');
      },
      action06GenerateReport: async () => {
        throw new Error('Operation timed out after 30000ms');
      },
      action07NotifyManager: async () => {
        throw new Error('Operation timed out after 30000ms');
      },
      action08RecordAuditLog: async (logEntry) => {
        auditLogs.push(logEntry);
        return { success: true };
      },
    };

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'manager-001',
      includeDetailedAnalysis: true,
    };

    const initialAttemptTime = Date.now();

    // Execute: runTx7Imp1Agentを実行
    const result: Tx7Imp1AgentOutput = await runTx7Imp1Agent(
      agentInput,
      fakeAiClient
    );

    const finalAttemptTime = Date.now();
    const elapsedSeconds = (finalAttemptTime - initialAttemptTime) / 1000;

    // Verify: 監査ログの検証
    expect(auditLogs.length).toBeGreaterThan(0);

    const timeoutLog = auditLogs.find((log) => log.failureReason === 'TIMEOUT');
    expect(timeoutLog).toBeDefined();

    // (1) failureReason フィールド = 'TIMEOUT'
    expect(timeoutLog?.failureReason).toBe('TIMEOUT');

    // (2) retryAttempts = 3
    expect(timeoutLog?.retryAttempts).toBe(3);

    // (3) retryIntervals = [3000, 10000, 30000]（ミリ秒）
    expect(timeoutLog?.retryIntervals).toEqual([3000, 10000, 30000]);

    // (4) timeoutThreshold = 30000（ミリ秒）
    expect(timeoutLog?.timeoutThreshold).toBe(30000);

    // (5) escalationTriggered = true
    expect(timeoutLog?.escalationTriggered).toBe(true);

    // (6) alertType = 'TIMEOUT_FAILURE_DETECTED'
    expect(timeoutLog?.alertType).toBe('TIMEOUT_FAILURE_DETECTED');

    // (7) 初回試行から最終試行までの経過時間が43秒以上46秒以下の範囲内
    // 再試行インターバル: 3秒 + 10秒 + 30秒 = 43秒
    expect(elapsedSeconds).toBeGreaterThanOrEqual(43);
    expect(elapsedSeconds).toBeLessThanOrEqual(46);

    // タイムアウト以外の原因がログに記録されていないことを確認
    const nonTimeoutLogs = auditLogs.filter(
      (log) => log.failureReason !== 'TIMEOUT'
    );
    expect(nonTimeoutLogs).toEqual([]);

    // executionStatus が失敗を示していることを確認
    expect(result.executionStatus).toBe('failure');
  });
});