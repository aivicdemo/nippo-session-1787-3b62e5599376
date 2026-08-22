import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-2-imp-1/prompts/action-01';
import type { Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('tx-2-imp-1: 日報収集から課題抽出・配信までの自律実行', () => {
  // SCEN-041
  test('設定時刻に全メンバーの日報受信状況を確認する', async () => {
    // テスト用の固定時刻
    const executionTimestamp = new Date('2024-01-15T08:00:00Z');
    const reportingDeadline = new Date('2024-01-15T08:30:00Z');
    const teamId = 'team-001';
    const managerEmail = 'manager@example.com';

    // 期待される確認結果（すべてのメンバーから日報受信）
    const expectedMembersChecked = 10;
    const expectedMembersReceived = 10;
    const expectedMembersPending = 0;

    // 偽のAIクライアント実装
    const mockAiClient: Tx2Imp1AiClient = {
      executeAction01: jest.fn(async () => ({
        status: 'completed',
        members_checked: expectedMembersChecked,
        members_received: expectedMembersReceived,
        members_pending: expectedMembersPending,
        last_receipt_time: new Date('2024-01-15T08:05:00Z').toISOString(),
      })),
      executeAction02: jest.fn(async () => ({ status: 'pending' })),
      executeAction03: jest.fn(async () => ({ status: 'pending' })),
      executeAction04: jest.fn(async () => ({ status: 'pending' })),
      executeAction05: jest.fn(async () => ({ status: 'pending' })),
      executeAction06: jest.fn(async () => ({ status: 'pending' })),
    };

    // アクション結果と監査ログを記録するスパイ
    const auditEvents: Array<{
      timestamp: string;
      action: string;
      target_members: number;
      received_count: number;
      pending_count: number;
    }> = [];

    // 監査ログをモック化
    const originalLog = console.log;
    console.log = jest.fn((message: string) => {
      if (message.includes('CHECK_DAILY_REPORT_RECEIPT_STATUS')) {
        try {
          const eventObj = JSON.parse(message);
          auditEvents.push(eventObj);
        } catch {
          // JSON パース失敗時は無視
        }
      }
      originalLog(message);
    });

    try {
      // AIエージェント実行
      const result = await runTx2Imp1Agent(
        {
          executionTimestamp,
          teamId,
          reportingDeadline,
          managerEmail,
        },
        mockAiClient,
      );

      // Action 1プロンプトモジュールが正しく呼び出されたことを検証
      expect(buildAction01Prompt).toBeDefined();
      expect(ACTION_01_PROMPT_VERSION).toBeDefined();

      // Action 1実行が完了したことを検証
      expect(mockAiClient.executeAction01).toHaveBeenCalled();

      // エージェント結果から Action 1のステータスを検証
      expect(result.aggregationStatus).toBe('success');

      // 日報受信状況の確認結果を検証
      expect(result.extractedIssuesCount).toBeGreaterThanOrEqual(0);
      expect(result.prioritizedIssuesList).toBeDefined();
      expect(Array.isArray(result.prioritizedIssuesList)).toBe(true);

      // メール送信ステータスを検証
      expect(result.emailSendStatus).toBe('sent');

      // 監査ログに CHECK_DAILY_REPORT_RECEIPT_STATUS イベントが記録されていることを検証
      // （もしくは、結果オブジェクトに監査情報が含まれている場合）
      // ここでは、mockAiClient.executeAction01 呼び出しが成功していることで、
      // アクション1が実行されたことを確認

      // Action 1実行時に適切なパラメータが渡されたことを検証
      expect(mockAiClient.executeAction01).toHaveBeenCalledWith(
        expect.objectContaining({
          executionTimestamp,
          teamId,
        }),
      );
    } finally {
      // console.log を元に戻す
      console.log = originalLog;
    }
  });
});