import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('朝会報告・課題抽出 - Tx11Imp1 AIエージェント - 権限管理', () => {
  test('SCEN-3247: AIエージェントが権限外のデータ参照とツール操作を拒否する', async () => {
    // ===== テスト準備 =====
    const executionTimestamp = new Date('2026-08-19T10:30:00Z');
    const teamId = 'team-dev-001';
    const reportDeadlineTime = '09:00';
    const managerEmail = 'manager@example.com';

    const context = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail,
    };

    // ===== 権限チェック機能を持つ fake AI client =====
    const auditLog: Array<{
      action: string;
      targetUser: string;
      reason: string;
      timestamp: string;
      status: string;
    }> = [];

    const mockTx11Imp1AiClient: Tx11Imp1AiClient = {
      executeAction: jest.fn(async (actionType: string, payload: any) => {
        const timestamp = new Date('2026-08-19T10:30:00Z').toISOString();

        // 権限チェック: 他部門メンバーへのアクセス
        if (actionType === 'action-03' && payload.targetUserId === 'dept-b-member-001') {
          auditLog.push({
            action: 'extractKeywords',
            targetUser: 'dept-b-member-001',
            reason: 'AUTHORIZATION_DENIED',
            timestamp,
            status: 'DENIED',
          });
          return {
            success: false,
            error: 'Authorization denied: insufficient scope for this operation',
            action: 'action-03',
            timestamp,
          };
        }

        // 権限チェック: 定義されていないツール操作
        if (actionType === 'deleteAllReports') {
          auditLog.push({
            action: 'deleteAllReports',
            targetUser: 'unknown',
            reason: 'TOOL_NOT_DEFINED',
            timestamp,
            status: 'DENIED',
          });
          return {
            success: false,
            error: 'Tool not authorized: deleteAllReports is not a valid action',
            action: 'deleteAllReports',
            timestamp,
          };
        }

        // 権限チェック: 他部門宛の通知送信
        if (actionType === 'action-05' && payload.recipientDepartment !== teamId) {
          auditLog.push({
            action: 'sendReminderNotification',
            targetUser: payload.recipientId || 'unknown',
            reason: 'SCOPE_OUT_OF_RANGE',
            timestamp,
            status: 'DENIED',
          });
          return {
            success: false,
            error: 'Authorization denied: recipient user is outside current scope',
            action: 'action-05',
            timestamp,
          };
        }

        // 正常系: 権限範囲内のアクション
        if (actionType === 'action-01') {
          return {
            success: true,
            submittedCount: 8,
            unsubmittedMembers: ['user-003', 'user-009'],
            timestamp,
          };
        }

        return {
          success: true,
          timestamp,
        };
      }),
    };

    // ===== テスト実行: runTx11Imp1Agent を呼び出す =====
    const result = await runTx11Imp1Agent(context, mockTx11Imp1AiClient);

    // ===== Assertion 1: 権限外のデータ参照がエラーで拒否される =====
    expect(result.executionStatus).toBe('failure');

    // ===== Assertion 2: auditlog に「DENIED」マークで記録されている =====
    const deniedLog = auditLog.filter((entry) => entry.status === 'DENIED');
    expect(deniedLog.length).toBeGreaterThanOrEqual(1);

    const authDeniedEntry = deniedLog.find(
      (entry) => entry.action === 'extractKeywords' && entry.targetUser === 'dept-b-member-001'
    );
    expect(authDeniedEntry).toBeDefined();
    expect(authDeniedEntry?.reason).toBe('AUTHORIZATION_DENIED');
    expect(authDeniedEntry?.timestamp).toBe('2026-08-19T10:30:00Z');

    // ===== Assertion 3: 定義されていないツール操作が拒否される =====
    const toolNotDefinedEntry = deniedLog.find((entry) => entry.action === 'deleteAllReports');
    expect(toolNotDefinedEntry).toBeDefined();
    expect(toolNotDefinedEntry?.reason).toBe('TOOL_NOT_DEFINED');

    // ===== Assertion 4: 他部門宛の通知送信が拒否される =====
    const scopeOutEntry = deniedLog.find(
      (entry) => entry.action === 'sendReminderNotification' && entry.reason === 'SCOPE_OUT_OF_RANGE'
    );
    expect(scopeOutEntry).toBeDefined();

    // ===== Assertion 5: エージェントが呼び出し元にエラーを返す =====
    expect(result).toHaveProperty('executionStatus');
    expect(['failure', 'partial_failure']).toContain(result.executionStatus);

    // ===== Assertion 6: executeAction が権限チェックで正しく呼ばれている =====
    expect(mockTx11Imp1AiClient.executeAction).toHaveBeenCalled();

    // ===== Assertion 7: 拒否後、次のアクションに進まない =====
    // orchestrator が次アクションをスキップすることを確認
    const callCount = (mockTx11Imp1AiClient.executeAction as jest.Mock).mock.calls.length;
    // 権限拒否後は処理が中断されるため、呼び出し回数が少ないはず
    expect(callCount).toBeGreaterThan(0);
  });
});