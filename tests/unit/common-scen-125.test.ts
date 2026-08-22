import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-01';
import type { Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-125
  test('should execute monthly report trigger confirmation on first day of month', async () => {
    // Arrange: テスト用の現在日時を毎月1日に設定
    const firstDayOfMonth = new Date('2024-01-01T00:00:00Z');
    const mockAuditEvents: Array<{ event: string; timestamp: Date; details: unknown }> = [];

    // モック済みTx7Imp1AiClientを初期化
    const mockAiClient: Tx7Imp1AiClient = {
      callAction01: jest.fn(async (prompt: string) => {
        mockAuditEvents.push({
          event: 'action_01_called',
          timestamp: firstDayOfMonth,
          details: { prompt },
        });
        return {
          success: true,
          triggerConfirmed: true,
          message: 'Monthly report generation trigger confirmed on first day',
        };
      }),
      callAction02: jest.fn(),
      callAction03: jest.fn(),
      callAction04: jest.fn(),
      callAction05: jest.fn(),
      callAction06: jest.fn(),
      callAction07: jest.fn(),
      callAction08: jest.fn(),
    };

    // Action 1 プロンプト構築のモック
    const mockPrompt = 'Check monthly report generation trigger on first day of month';
    jest.spyOn(require('../../src/agents/tx-7-imp-1/prompts/action-01'), 'buildAction01Prompt').mockReturnValue(mockPrompt);

    // Act: runTx7Imp1Agent関数を実行
    const result = await runTx7Imp1Agent(firstDayOfMonth, mockAiClient);

    // Assert: Action 1プロンプトが正確に構築されていることを検証
    expect(buildAction01Prompt).toHaveBeenCalled();

    // ACTION_01_PROMPT_VERSIONが参照されていることをアサート
    expect(ACTION_01_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_01_PROMPT_VERSION).toBe('string');

    // モック済みAI ClientがビルドされたプロンプトでcallAction01が呼び出されていることを確認
    expect(mockAiClient.callAction01).toHaveBeenCalledWith(expect.stringContaining('first day'));

    // オーケストレーターがモック AI Clientの返却値を正常に受け取ることを検証
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.triggerConfirmed).toBe(true);

    // トリガー確認の実行結果ログが監査イベントとして記録されていることをアサート
    const triggerConfirmedEvent = mockAuditEvents.find((evt) => evt.event === 'action_01_called');
    expect(triggerConfirmedEvent).toBeDefined();
    expect(triggerConfirmedEvent?.timestamp).toEqual(firstDayOfMonth);

    // 実行結果の監査ログにtrigger_confirmed_on_first_dayが含まれていることを検証
    expect(result.auditLog).toContain('trigger_confirmed_on_first_day');

    // 後続のAction 2以降は実行されないことを検証
    expect(mockAiClient.callAction02).not.toHaveBeenCalled();
    expect(mockAiClient.callAction03).not.toHaveBeenCalled();
    expect(mockAiClient.callAction04).not.toHaveBeenCalled();
    expect(mockAiClient.callAction05).not.toHaveBeenCalled();
    expect(mockAiClient.callAction06).not.toHaveBeenCalled();
    expect(mockAiClient.callAction07).not.toHaveBeenCalled();
    expect(mockAiClient.callAction08).not.toHaveBeenCalled();
  });
});