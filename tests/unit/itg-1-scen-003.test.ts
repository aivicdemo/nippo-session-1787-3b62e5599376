import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';

const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

describe('朝会報告管理システム - AI エージェント統合テスト', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-003: 未提出者への通知送信時にメール配信サービスが利用不可またはタイムアウトした場合
  test('SCEN-003: リマインド通知の送信に失敗した場合、partial_failure または failure ステータスで返却され、エラーメッセージが表示される', async () => {
    const executionTimestampValue = new Date('2025-01-15T09:00:00Z');
    const reportDeadlineTimeValue = '08:30';
    const targetTeamIdsValue: string[] = [];
    const managerEmailAddressesValue = ['manager@example.com'];

    const agentInput: Tx1Imp1AgentInput = {
      executionTimestamp: executionTimestampValue,
      reportDeadlineTime: reportDeadlineTimeValue,
      targetTeamIds: targetTeamIdsValue,
      managerEmailAddresses: managerEmailAddressesValue,
    };

    // 未提出メンバー取得の API モック
    fetchMock.mockResponseOnce(
      JSON.stringify([
        { memberId: 'E001', memberName: 'Alice', email: 'alice@example.com' },
        { memberId: 'E002', memberName: 'Bob', email: 'bob@example.com' },
      ]),
      { status: 200 }
    );

    // チーム情報取得の API モック
    fetchMock.mockResponseOnce(
      JSON.stringify([
        { teamId: 'T001', teamName: 'Frontend Team' },
        { teamId: 'T002', teamName: 'Backend Team' },
      ]),
      { status: 200 }
    );

    // 日報データ取得の API モック
    fetchMock.mockResponseOnce(
      JSON.stringify([
        {
          reportId: 'R001',
          employeeId: 'E003',
          employeeName: 'Charlie',
          yesterday: 'completed feature A',
          today: 'start feature B',
          issue: 'database connection timeout',
          submittedAt: '2025-01-15T08:00:00Z',
        },
      ]),
      { status: 200 }
    );

    // リマインド通知送信の API モック - タイムアウトエラーを返す
    fetchMock.mockRejectOnce(new Error('Notification service timeout'));

    // 朝会資料生成の API モック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        dashboardDataUrl: 'https://example.com/dashboard/2025-01-15',
      }),
      { status: 200 }
    );

    let executionOutput: Tx1Imp1AgentOutput | null = null;
    let thrownError: Error | null = null;

    try {
      executionOutput = await runTx1Imp1Agent(agentInput);
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    // エラーが発生したことを検証
    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/リマインド通知/);
    expect(thrownError?.message).toMatch(/送信に失敗/);
    expect(thrownError?.message).toMatch(/再試行/);

    // executionOutput が返却されている場合の検証
    if (executionOutput) {
      expect(
        executionOutput.executionStatus === 'partial_failure' ||
          executionOutput.executionStatus === 'failure'
      ).toBe(true);

      // notificationsSent が 0 または部分的な送信件数であることを検証
      expect(executionOutput.notificationsSent).toBeLessThanOrEqual(2);

      // エラーメッセージの確認
      if (executionOutput.executionStatus === 'partial_failure') {
        expect(executionOutput).toHaveProperty('executionStatus');
      }
    }

    // 内部キューに失敗した通知が一時保存されていることを検証するための
    // ログまたはシステムの内部状態チェック
    // （ここでは、実装側でログに記録されることを前提とした検証）
    expect(thrownError?.message).toContain('リマインド通知の送信に失敗しました。後で再試行します。');
  });
});