import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行 - ロールバック検証', () => {
  // SCEN-3214
  test('Action 3失敗時に完了済み副作用を巻き戻す', async () => {
    // Arrange: テスト用の偽AIクライアント初期化
    const mockAuditLog: Array<{
      timestamp: string;
      action: string;
      status: string;
      details?: string;
    }> = [];

    const mockDatabase: {
      action1_results?: Array<{ id: string; keyword: string }>;
      action2_results?: Array<{ pattern: string; frequency: number }>;
      action3_results?: Array<{ bottleneck: string }>;
    } = {};

    const fakeAiClient: Tx8Imp1AiClient = {
      executeAction1_SearchExtract: jest.fn(async (prompt: string) => {
        mockAuditLog.push({
          timestamp: new Date('2024-01-15T11:00:00Z').toISOString(),
          action: 'Action 1 started',
          status: 'in_progress',
        });

        // Action 1: 朝会報告システムから課題データを検索・抽出
        const action1Results = [
          { id: 'issue_001', keyword: 'データベース遅延' },
          { id: 'issue_002', keyword: 'API エラー' },
        ];
        mockDatabase.action1_results = action1Results;

        mockAuditLog.push({
          timestamp: new Date('2024-01-15T11:01:00Z').toISOString(),
          action: 'Action 1 completed',
          status: 'success',
          details: `extracted ${action1Results.length} issues`,
        });

        return {
          issueCount: action1Results.length,
          issues: action1Results,
        };
      }),

      executeAction2_TimeSeriesAnalysis: jest.fn(async (prompt: string) => {
        mockAuditLog.push({
          timestamp: new Date('2024-01-15T11:02:00Z').toISOString(),
          action: 'Action 2 started',
          status: 'in_progress',
        });

        // Action 2: 再発パターンを時系列で分析
        const action2Results = [
          { pattern: '増加傾向', frequency: 5 },
          { pattern: '周期的', frequency: 3 },
        ];
        mockDatabase.action2_results = action2Results;

        mockAuditLog.push({
          timestamp: new Date('2024-01-15T11:03:00Z').toISOString(),
          action: 'Action 2 completed',
          status: 'success',
          details: `analyzed ${action2Results.length} patterns`,
        });

        return {
          patternCount: action2Results.length,
          patterns: action2Results,
        };
      }),

      executeAction3_BottleneckPattern: jest.fn(async (prompt: string) => {
        mockAuditLog.push({
          timestamp: new Date('2024-01-15T11:04:00Z').toISOString(),
          action: 'Action 3 started',
          status: 'in_progress',
        });

        // Action 3の実行中に意図的にエラーを注入
        mockAuditLog.push({
          timestamp: new Date('2024-01-15T11:04:30Z').toISOString(),
          action: 'Action 3 failed',
          status: 'error',
          details: '解析ロジック矛盾エラー: パターン分析結果が不整合',
        });

        throw new Error('解析ロジック矛盾エラー: ボトルネック変化パターンの特定に失敗しました');
      }),

      executeAction4_VisualizationGeneration: jest.fn(async (prompt: string) => {
        // Action 4 は実行されないはず
        throw new Error('Action 4 should not be executed');
      }),

      executeAction5_PriorityExtraction: jest.fn(async (prompt: string) => {
        // Action 5 は実行されないはず
        throw new Error('Action 5 should not be executed');
      }),
    };

    // Act: オーケストレータを呼び出し
    const orchestrationResult = await runTx8Imp1Agent(
      {
        analysisStartDate: '2024-01-01T00:00:00Z',
        analysisEndDate: '2024-01-15T23:59:59Z',
        teamIds: ['team_001', 'team_002'],
        minimumRecurrenceThreshold: 3,
        recipientManagerId: 'manager_001',
      },
      fakeAiClient
    );

    // Assert: ロールバック処理が実行された
    // 1. Action 1で検索・抽出された課題データが削除されている
    expect(mockDatabase.action1_results).toBeUndefined();

    // 2. Action 2で生成された再発パターン分析テーブルが削除されている
    expect(mockDatabase.action2_results).toBeUndefined();

    // 3. Action 3で意図的に失敗が発生した
    expect(orchestrationResult.status).toBe('partial_failure');
    expect(orchestrationResult.failedAction).toBe('Action 3');

    // 4. Action 4およびAction 5は実行されていない
    expect(fakeAiClient.executeAction4_VisualizationGeneration).not.toHaveBeenCalled();
    expect(fakeAiClient.executeAction5_PriorityExtraction).not.toHaveBeenCalled();

    // 5. 監査ログを検証
    const auditLogMessages = mockAuditLog.map((log) => log.action);
    expect(auditLogMessages).toEqual([
      'Action 1 started',
      'Action 1 completed',
      'Action 2 started',
      'Action 2 completed',
      'Action 3 started',
      'Action 3 failed',
    ]);

    // 6. ロールバック実行を示す監査ログが追加されているか確認
    expect(orchestrationResult.auditLog).toContainEqual(
      expect.objectContaining({
        action: 'rollback_executed',
        status: 'success',
      })
    );

    // 7. Action 1副作用削除ログが記録されている
    expect(orchestrationResult.auditLog).toContainEqual(
      expect.objectContaining({
        action: 'Action 1副作用削除',
        status: 'success',
      })
    );

    // 8. Action 2副作用削除ログが記録されている
    expect(orchestrationResult.auditLog).toContainEqual(
      expect.objectContaining({
        action: 'Action 2副作用削除',
        status: 'success',
      })
    );

    // 9. オーケストレータの最終状態が期待値と一致
    expect(orchestrationResult.completedActions).toEqual(['Action 1', 'Action 2']);
    expect(orchestrationResult.skippedActions).toEqual([
      'Action 4',
      'Action 5',
    ]);

    // 10. エラーメッセージが含まれている
    expect(orchestrationResult.errorMessage).toContain('解析ロジック矛盾エラー');

    // 11. 最終的にシステム状態が復帰していることを確認
    expect(orchestrationResult.systemState).toBe(
      'rolled_back_to_pre_action1_state'
    );
  });
});