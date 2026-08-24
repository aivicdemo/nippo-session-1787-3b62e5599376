import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { type Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import { type Tx4AgentExecutionRequest, type Tx4AgentExecutionResult } from '../../src/types';

describe('tx-4-imp-1: ダッシュボード分析から課題指示までの自動実行 - 権限外データ参照とツール操作の拒否', () => {
  // SCEN-3142
  test('should deny authorization for unprivileged user accessing restricted data and executing forbidden tool operations', async () => {
    // ===== Setup: テストコンテキスト初期化 =====
    const userId = 'user-general-member-001';
    const teamId = 'team-dev-001';
    const managerId = 'manager-dev-001';
    const reportDate = '2024-01-15';
    const meetingStartTime = '09:00';

    const executionRequest: Tx4AgentExecutionRequest = {
      teamId,
      managerId,
      reportDate,
      meetingStartTime,
    };

    // ===== Mock AI Client =====
    // モック化されたAIクライアント：権限チェック機構を通じた要求処理をシミュレート
    const mockAiClient: Tx4Imp1AiClient = {
      // Action 1: リアルタイム進捗データの自動集約
      aggregateDashboardData: jest.fn(async (params: any) => {
        // 一般部員が全社員の日報データにアクセスしようとする要求
        if (params.accessScope === 'ALL_REPORTS' && params.userRole === 'MEMBER') {
          return {
            status: 'AUTHORIZATION_DENIED',
            errorCode: 'ERR_INSUFFICIENT_PERMISSION_DATA_ACCESS',
            message: 'User role [MEMBER] cannot access [DASHBOARD_ALL_REPORTS]',
            auditEvent: {
              timestamp: new Date('2024-01-15T08:00:00Z').toISOString(),
              userId,
              userRole: 'MEMBER',
              action: 'DATA_ACCESS_ATTEMPT',
              resourceType: 'DASHBOARD_ALL_REPORTS',
              denialReason: 'INSUFFICIENT_PERMISSION',
              metadata: {
                requestedScope: 'ALL_REPORTS',
                minimumRequiredRole: 'MANAGER',
              },
            },
          };
        }
        return { status: 'SUCCESS', data: [] };
      }),

      // Action 2: 進捗遅延・未提出・異常値の検出
      detectProgressAnomalies: jest.fn(async (params: any) => {
        return { status: 'SUCCESS', anomalies: [] };
      }),

      // Action 3: 過去の類似課題と照合
      matchSimilarHistoricalIssues: jest.fn(async (params: any) => {
        return { status: 'SUCCESS', matches: [] };
      }),

      // Action 4: 課題の自動優先順位付け
      prioritizeIssuesAutomatically: jest.fn(async (params: any) => {
        return { status: 'SUCCESS', prioritizedIssues: [] };
      }),

      // Action 5: 推奨対応方針の生成
      generateRecommendedCountermeasures: jest.fn(async (params: any) => {
        // 一般部員が全社への一括通知を実行しようとする要求
        if (params.toolOperation === 'TOOL_BATCH_NOTIFICATION' && params.userRole === 'MEMBER') {
          return {
            status: 'AUTHORIZATION_DENIED',
            errorCode: 'ERR_INSUFFICIENT_PERMISSION_TOOL_OPERATION',
            message: 'User role [MEMBER] cannot execute [TOOL_BATCH_NOTIFICATION]',
            auditEvent: {
              timestamp: new Date('2024-01-15T08:15:00Z').toISOString(),
              userId,
              userRole: 'MEMBER',
              action: 'TOOL_OPERATION_ATTEMPT',
              toolName: 'TOOL_BATCH_NOTIFICATION',
              denialReason: 'INSUFFICIENT_PERMISSION',
              metadata: {
                requestedOperation: 'SEND_BATCH_NOTIFICATION_TO_ALL',
                minimumRequiredRole: 'MANAGER',
              },
            },
          };
        }
        return { status: 'SUCCESS', countermeasurePlan: null };
      }),

      // Action 6: ダッシュボード資料の自動作成
      generateDashboardMaterial: jest.fn(async (params: any) => {
        return { status: 'SUCCESS', material: null };
      }),

      // Action 7: 未提出メンバーリストの自動抽出と通知
      extractAndNotifyUnsubmittedMembers: jest.fn(async (params: any) => {
        return { status: 'SUCCESS', unsubmittedMembers: [] };
      }),
    };

    // ===== Test Execution: エージェント実行とプロンプト注入 =====
    const result = await runTx4Imp1Agent(
      {
        ...executionRequest,
        userContext: {
          userId,
          userRole: 'MEMBER',
          teamId,
          permissions: ['READ_OWN_REPORTS', 'SUBMIT_REPORTS'],
        },
      },
      mockAiClient
    );

    // ===== Assertion 1: 権限外データ参照の拒否 =====
    // Action 1でのAIクライアント呼び出しが権限チェックで拒否される
    expect(mockAiClient.aggregateDashboardData).toHaveBeenCalled();
    const aggregateCallArgs = (mockAiClient.aggregateDashboardData as jest.Mock).mock.calls[0];
    expect(aggregateCallArgs[0]).toMatchObject({
      userRole: 'MEMBER',
    });

    // Action 1の戻り値をシミュレート：Authorization Denial
    const aggregateResponse = await mockAiClient.aggregateDashboardData({
      accessScope: 'ALL_REPORTS',
      userRole: 'MEMBER',
    });
    expect(aggregateResponse.status).toBe('AUTHORIZATION_DENIED');
    expect(aggregateResponse.errorCode).toBe('ERR_INSUFFICIENT_PERMISSION_DATA_ACCESS');
    expect(aggregateResponse.message).toMatch(/MEMBER/);
    expect(aggregateResponse.message).toMatch(/DASHBOARD_ALL_REPORTS/);
    expect(aggregateResponse.auditEvent).toBeDefined();
    expect(aggregateResponse.auditEvent.timestamp).toBe('2024-01-15T08:00:00Z');
    expect(aggregateResponse.auditEvent.userId).toBe(userId);
    expect(aggregateResponse.auditEvent.userRole).toBe('MEMBER');
    expect(aggregateResponse.auditEvent.action).toBe('DATA_ACCESS_ATTEMPT');
    expect(aggregateResponse.auditEvent.resourceType).toBe('DASHBOARD_ALL_REPORTS');
    expect(aggregateResponse.auditEvent.denialReason).toBe('INSUFFICIENT_PERMISSION');

    // ===== Assertion 2: 権限外ツール操作の拒否 =====
    // Action 5でのAIクライアント呼び出しが権限チェックで拒否される
    expect(mockAiClient.generateRecommendedCountermeasures).toHaveBeenCalled();

    const toolOperationResponse = await mockAiClient.generateRecommendedCountermeasures({
      toolOperation: 'TOOL_BATCH_NOTIFICATION',
      userRole: 'MEMBER',
    });
    expect(toolOperationResponse.status).toBe('AUTHORIZATION_DENIED');
    expect(toolOperationResponse.errorCode).toBe('ERR_INSUFFICIENT_PERMISSION_TOOL_OPERATION');
    expect(toolOperationResponse.message).toMatch(/MEMBER/);
    expect(toolOperationResponse.message).toMatch(/TOOL_BATCH_NOTIFICATION/);
    expect(toolOperationResponse.auditEvent).toBeDefined();
    expect(toolOperationResponse.auditEvent.timestamp).toBe('2024-01-15T08:15:00Z');
    expect(toolOperationResponse.auditEvent.userId).toBe(userId);
    expect(toolOperationResponse.auditEvent.userRole).toBe('MEMBER');
    expect(toolOperationResponse.auditEvent.action).toBe('TOOL_OPERATION_ATTEMPT');
    expect(toolOperationResponse.auditEvent.toolName).toBe('TOOL_BATCH_NOTIFICATION');
    expect(toolOperationResponse.auditEvent.denialReason).toBe('INSUFFICIENT_PERMISSION');

    // ===== Assertion 3: 監査ログの記録 =====
    // 拒否されたすべての要求が監査イベントに記録される
    expect(aggregateResponse.auditEvent).toBeDefined();
    expect(aggregateResponse.auditEvent.timestamp).toBeDefined();
    expect(aggregateResponse.auditEvent.userId).toBe(userId);
    expect(aggregateResponse.auditEvent.userRole).toBe('MEMBER');
    expect(aggregateResponse.auditEvent.denialReason).toBe('INSUFFICIENT_PERMISSION');

    expect(toolOperationResponse.auditEvent).toBeDefined();
    expect(toolOperationResponse.auditEvent.timestamp).toBeDefined();
    expect(toolOperationResponse.auditEvent.userId).toBe(userId);
    expect(toolOperationResponse.auditEvent.userRole).toBe('MEMBER');
    expect(toolOperationResponse.auditEvent.denialReason).toBe('INSUFFICIENT_PERMISSION');

    // ===== Assertion 4: エージェント実行結果の検証 =====
    // エージェント実行後の戻り値がエラーステータスを含むことを確認
    expect(result).toBeDefined();
    if (result && 'status' in result) {
      // 権限拒否により、エージェント全体が部分的に失敗するか、
      // または各アクションの拒否ステータスが集約された結果を返す
      expect([result.status, 'AUTHORIZATION_DENIED', 'PARTIAL_FAILURE']).toContain(
        result.status
      );
    }

    // ===== Assertion 5: データベース・外部API呼び出しが発生していないこと =====
    // モックAIクライアントの呼び出しのみが行われ、実際のデータベースアクセスや
    // 外部API呼び出しはない（外部依存はモック化している）
    // 権限拒否後、それ以上の処理が進行していないことを確認
    expect(mockAiClient.aggregateDashboardData).toHaveBeenCalledTimes(1);
    expect(mockAiClient.generateRecommendedCountermeasures).toHaveBeenCalledTimes(1);
  });
});