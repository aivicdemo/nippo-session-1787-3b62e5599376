import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  let auditLog: Array<{ event: string; timestamp: string; details: Record<string, unknown> }>;
  let escalationEvents: Array<{ condition: string; timestamp: string; context: Record<string, unknown> }>;

  beforeEach(() => {
    auditLog = [];
    escalationEvents = [];
  });

  afterEach(() => {
    auditLog = [];
    escalationEvents = [];
  });

  // SCEN-053: [error] 日報収集から課題抽出・配信までの自律実行 AIエージェント - 権限外のデータ参照とツール操作を拒否する
  test('SCEN-053: should deny unauthorized data access and tool operations during report collection and distribution', async () => {
    // Setup: フェイクAIクライアント with 権限チェック機能
    const fakeAiClient = {
      async callAction01GetReportStatus() {
        // Action 1: 権限外のメンバー日報データへのアクセス拒否
        const authError = new Error('Authorization Denied: Unauthorized data access attempt by agent at Action 1');
        (authError as any).code = 'AUTHORIZATION_DENIED';
        (authError as any).action = 'Action 1';
        (authError as any).resource = 'member_report_data';
        throw authError;
      },
      async callAction02ConvertFormat() {
        // Action 2: メールシステムへの操作拒否
        const authError = new Error('Authorization Denied: Unauthorized tool operation attempt by agent at Action 2');
        (authError as any).code = 'AUTHORIZATION_DENIED';
        (authError as any).action = 'Action 2';
        (authError as any).resource = 'mail_system_write';
        throw authError;
      },
      async callAction03ExtractIssues() {
        // Action 3: 個人情報処理の権限確認
        const authError = new Error('Authorization Denied: Unauthorized personal data processing at Action 3');
        (authError as any).code = 'AUTHORIZATION_DENIED';
        (authError as any).action = 'Action 3';
        (authError as any).resource = 'personal_data';
        throw authError;
      },
      async callAction04RankPriority() {
        // Mock: Action 4 は到達しない
        throw new Error('Should not reach Action 4');
      },
      async callAction05GenerateMaterial() {
        // Mock: Action 5 は到達しない
        throw new Error('Should not reach Action 5');
      },
      async callAction06SendNotification() {
        // Mock: Action 6 は到達しない
        throw new Error('Should not reach Action 6');
      },
    };

    // Setup: テスト用ユーザーコンテキスト（一般メンバー権限）
    const userContext = {
      userId: 'member-001',
      role: 'member',
      permissions: ['read:own_report', 'write:own_report'],
      teamId: 'team-001',
    };

    // Setup: テスト入力
    const input = {
      executionId: 'exec-20240115-001',
      scheduledTime: '2024-01-15T09:00:00Z',
      aiClientInterface: fakeAiClient,
      userContext,
      config: {
        retryPolicy: { maxAttempts: 1, backoffMs: 0 },
        auditLogCallback: (event: { event: string; timestamp: string; details: Record<string, unknown> }) => {
          auditLog.push(event);
        },
        escalationCallback: (event: { condition: string; timestamp: string; context: Record<string, unknown> }) => {
          escalationEvents.push(event);
        },
      },
    };

    // Execute: sendUnsubmittedReminder 関数を呼び出し
    let actualResult: any;
    let thrownError: any;

    try {
      actualResult = await sendUnsubmittedReminder(input);
    } catch (err) {
      thrownError = err;
    }

    // Verify: 権限エラーがスローされたことを確認
    expect(thrownError).toBeDefined();
    expect(thrownError.message).toMatch(/Authorization Denied/);
    expect(thrownError.code).toBe('AUTHORIZATION_DENIED');
    expect(thrownError.action).toBe('Action 1');

    // Verify: Audit ログに記録されたか確認
    const authDenialLog = auditLog.find(
      (log) => log.details.code === 'AUTHORIZATION_DENIED' && log.details.action === 'Action 1',
    );
    expect(authDenialLog).toBeDefined();
    expect(authDenialLog?.event).toMatch(/Authorization Denied/);
    expect(authDenialLog?.details.resource).toBe('member_report_data');

    // Verify: エスカレーション条件が発動したか確認
    const escalationEvent = escalationEvents.find((e) => e.condition === 'authorization_denial');
    expect(escalationEvent).toBeDefined();
    expect(escalationEvent?.context.agentAction).toBe('Action 1');
    expect(escalationEvent?.context.errorCode).toBe('AUTHORIZATION_DENIED');

    // Verify: 処理が中断され、部長への確認メールが送信されていないことを確認
    expect(actualResult).toBeUndefined();
    expect(thrownError.retryable).toBeUndefined(); // 再試行フラグが立たない

    // Verify: Agent 実行結果がエラーステータスで返されたことを確認
    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError.code).toBe('AUTHORIZATION_DENIED');
  });
});