import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成 - AIエージェント tx-7-imp-1', () => {
  // SCEN-1853: [error] 月次課題傾向分析レポート生成 - 再試行回数が 3 を超えるときエラーになる
  test('TextAnalysisServiceAdapter呼び出しが3回の再試行を超過したときエラーが発生する', async () => {
    const target_month = '2024-01';
    const manager_user_id = 'manager-001';
    const trigger_timestamp = new Date('2024-02-01T09:00:00Z');

    const input: Tx7Imp1AgentInput = {
      triggerTimestamp: trigger_timestamp,
      targetMonth: target_month,
      managerUserId: manager_user_id,
      includeDetailedAnalysis: true,
    };

    let extract_keywords_call_count = 0;
    const mock_ai_client: Tx7Imp1AiClient = {
      extractKeywords: jest.fn(async () => {
        extract_keywords_call_count += 1;
        if (extract_keywords_call_count <= 4) {
          // 1回目（初回失敗）、2回目（3秒後失敗）、3回目（10秒後失敗）、4回目（30秒後失敗）
          const error = new Error('API timeout');
          error.name = 'TimeoutError';
          throw error;
        }
        return [];
      }),
      fetchReportData: jest.fn(async () => ({
        reports: [],
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
      })),
      analyzeBottleneckTrend: jest.fn(async () => ({
        timeSeriesData: [],
        improvementTrend: 'stable' as const,
        recurringIssuePattern: [],
      })),
      calculateTeamPerformanceMetrics: jest.fn(async () => ({
        average_resolution_days: 0,
        submission_rate: 0,
        reoccurrence_rate: 0,
      })),
      sendManagerNotification: jest.fn(async () => ({
        success: false,
        message: 'Failed to send notification due to upstream error',
      })),
      logAuditEvent: jest.fn(async () => undefined),
      getDashboardFallbackData: jest.fn(async () => ({
        status: 'fallback_mode',
        message: '課題分析が一時的に利用できません。手動入力をご利用ください',
      })),
    };

    const result = await runTx7Imp1Agent(input, mock_ai_client);

    expect(extract_keywords_call_count).toBe(4);
    expect(result.executionStatus).toBe('failure');
    expect(result.analysisResultSummary).toBeNull();
    expect(mock_ai_client.extractKeywords).toHaveBeenCalledTimes(4);
    expect(mock_ai_client.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'RETRY_LIMIT_EXCEEDED',
        message: expect.stringContaining('課題キーワード抽出の最大再試行回数（3回）を超過しました'),
      })
    );
  });
});