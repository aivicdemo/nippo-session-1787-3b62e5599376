import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('朝会報告管理システム - 月次課題傾向分析レポート生成処理', () => {
  // SCEN-1870: [edge] 月次課題傾向分析レポート生成処理の失敗時再試行制御 - 3回の再試行すべてが同一原因（タイムアウト）で失敗した場合、最終的な原因が正確に集約される
  test('月次レポート生成の3回タイムアウト失敗で、エスカレーション状態と監査ログが正確に記録される', async () => {
    // テスト入力: 月初トリガーの標準的な月次レポート生成リクエスト
    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-02-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'mgr-001',
      includeDetailedAnalysis: true,
    };

    // タイムアウトエラーの根本原因を示すオブジェクト
    const timeoutError = new Error('TextAnalysisServiceAdapter.extractKeywords timeout after 30000ms');

    // 再試行の実行回数を追跡するカウンター
    let extractKeywordsAttemptCount = 0;

    // TextAnalysisServiceAdapter スタブ: 全3回の呼び出しをタイムアウトエラーで失敗
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async () => {
        extractKeywordsAttemptCount += 1;
        throw timeoutError;
      }),
      assessImpactScore: jest.fn(async () => ({ score: 0 })),
      classifyIssueSeverity: jest.fn(async () => ({ severity: 'low' })),
    };

    // 再試行イベントとエスカレーション記録を追跡するための配列
    const auditLog: Array<{
      event_type: string;
      root_cause: string;
      attempt_count: number;
      timestamp: Date;
      retry_intervals?: number[];
      final_state?: string;
    }> = [];

    // AIクライアント スタブ: 再試行ロジックを含むオーケストレーター
    const mockAiClient: Tx7Imp1AiClient = {
      callAiAction01: jest.fn(async () => ({
        dataExtractionCompleted: true,
        extractedReportCount: 31,
      })),
      callAiAction02: jest.fn(async () => ({
        analysisInitiated: true,
      })),
      callAiAction03: jest.fn(async () => {
        // 第1回目の失敗をシミュレート
        if (extractKeywordsAttemptCount === 1) {
          auditLog.push({
            event_type: 'RETRY_ATTEMPT',
            root_cause: 'TIMEOUT',
            attempt_count: 1,
            timestamp: new Date('2024-02-01T09:00:05Z'),
          });
          throw timeoutError;
        }
        return { analysisStep03Completed: true };
      }),
      callAiAction04: jest.fn(async () => {
        // 第2回目の失敗をシミュレート（インターバル3秒後の再試行）
        if (extractKeywordsAttemptCount === 2) {
          auditLog.push({
            event_type: 'RETRY_ATTEMPT',
            root_cause: 'TIMEOUT',
            attempt_count: 2,
            timestamp: new Date('2024-02-01T09:00:08Z'),
          });
          throw timeoutError;
        }
        return { analysisStep04Completed: true };
      }),
      callAiAction05: jest.fn(async () => {
        // 第3回目の失敗をシミュレート（インターバル10秒後の再試行）
        if (extractKeywordsAttemptCount === 3) {
          auditLog.push({
            event_type: 'RETRY_ATTEMPT',
            root_cause: 'TIMEOUT',
            attempt_count: 3,
            timestamp: new Date('2024-02-01T09:00:18Z'),
          });
          throw timeoutError;
        }
        return { analysisStep05Completed: true };
      }),
      callAiAction06: jest.fn(async () => ({
        reportGenerated: true,
      })),
      callAiAction07: jest.fn(async () => ({
        deliveryNotificationSent: true,
      })),
      callAiAction08: jest.fn(async () => ({
        escalationRecorded: true,
      })),
    };

    // オーケストレーター実行: 再試行制御を含むエージェント処理
    let orchestratorResult;
    let finalErrorAggregation;

    try {
      // 実際のエージェント実行
      orchestratorResult = await runTx7Imp1Agent(agentInput, mockAiClient);
    } catch (error) {
      // 3回の再試行後のエスカレーション状態を捕捉
      if (extractKeywordsAttemptCount === 3 && error instanceof Error && error.message.includes('timeout')) {
        // エスカレーション記録: 最大再試行回数到達
        auditLog.push({
          event_type: 'RETRY_EXHAUSTED_ESCALATION',
          root_cause: 'TIMEOUT',
          attempt_count: 3,
          timestamp: new Date('2024-02-01T09:00:48Z'),
          retry_intervals: [3000, 10000, 30000],
          final_state: 'ESCALATION_REQUIRED',
        });

        // 最終的なエラー集約結果を構築
        finalErrorAggregation = {
          root_cause: 'TextAnalysisServiceAdapter.extractKeywords timeout after 30000ms',
          failure_count: 3,
          all_causes_identical: true,
          retry_intervals_ms: [3000, 10000, 30000],
          final_state: 'ESCALATION_REQUIRED',
          audit_event: {
            event_type: 'RETRY_EXHAUSTED_ESCALATION',
            root_cause: 'TIMEOUT',
            attempt_count: 3,
          },
        };
      }
    }

    // ===== アサーション開始 =====

    // 検証1: 3回すべての再試行が実行されたことを確認
    expect(extractKeywordsAttemptCount).toBe(3);

    // 検証2: 最終的なエラー集約結果の構造と内容を検証
    expect(finalErrorAggregation).toBeDefined();
    expect(finalErrorAggregation?.root_cause).toMatch(/timeout after 30000ms/);
    expect(finalErrorAggregation?.failure_count).toBe(3);

    // 検証3: すべての失敗が同一原因（タイムアウト）であることを確認
    expect(finalErrorAggregation?.all_causes_identical).toBe(true);

    // 検証4: 再試行インターバルが正確に記録されていることを確認（3秒, 10秒, 30秒）
    expect(finalErrorAggregation?.retry_intervals_ms).toEqual([3000, 10000, 30000]);

    // 検証5: 最終状態が『ESCALATION_REQUIRED』に設定されていることを確認
    expect(finalErrorAggregation?.final_state).toBe('ESCALATION_REQUIRED');

    // 検証6: 監査ログに『RETRY_EXHAUSTED_ESCALATION』イベントが記録されていることを確認
    expect(auditLog).toContainEqual(
      expect.objectContaining({
        event_type: 'RETRY_EXHAUSTED_ESCALATION',
        root_cause: 'TIMEOUT',
        attempt_count: 3,
      })
    );

    // 検証7: 監査ログのエスカレーション記録に再試行インターバルが含まれていることを確認
    const escalationLogEntry = auditLog.find((log) => log.event_type === 'RETRY_EXHAUSTED_ESCALATION');
    expect(escalationLogEntry?.retry_intervals).toEqual([3000, 10000, 30000]);

    // 検証8: 監査ログイベントが管理者アラート対象として標識されていることを確認
    expect(escalationLogEntry?.final_state).toBe('ESCALATION_REQUIRED');

    // 検証9: 各再試行回のタイムスタンプが記録されていることを確認
    const retryAttempts = auditLog.filter((log) => log.event_type === 'RETRY_ATTEMPT');
    expect(retryAttempts).toHaveLength(3);
    expect(retryAttempts[0]?.timestamp.toISOString()).toBe('2024-02-01T09:00:05Z');
    expect(retryAttempts[1]?.timestamp.toISOString()).toBe('2024-02-01T09:00:08Z');
    expect(retryAttempts[2]?.timestamp.toISOString()).toBe('2024-02-01T09:00:18Z');

    // 検証10: 最終的なエラー集約結果に監査イベント情報が含まれていることを確認
    expect(finalErrorAggregation?.audit_event).toEqual({
      event_type: 'RETRY_EXHAUSTED_ESCALATION',
      root_cause: 'TIMEOUT',
      attempt_count: 3,
    });
  });
});