import { describe, test, expect, beforeEach } from '@jest/globals';
import { getDashboardData } from '../../src/logic/dashboard-display';

describe('Dashboard Display Logic', () => {
  test('SCEN-192: AIエージェント実行完了時の監査記録検証', () => {
    // Arrange: テスト用のモック監査ログストレージ初期化
    const auditLog: Array<{
      eventId: string;
      transactionId: string;
      timestamp: string;
      actionId: string;
      statusCode: string;
      executorId: string;
      relatedResourceId: string;
      details?: Record<string, unknown>;
    }> = [];

    const baseTimestamp = new Date('2024-01-15T08:00:00Z');
    const txId = 'tx_10_imp_1_20240115_080000_00001';
    const executorId = 'agent_tx10_imp1';

    // Act: getDashboardDataを実行し、監査記録の流れをシミュレート
    // 実際のエージェント実行を模擬したデータフロー
    const dashboardData = getDashboardData({
      transactionId: txId,
      executorId: executorId,
      auditLog: auditLog,
      baseTimestamp: baseTimestamp,
      departmentSize: 50,
      engineerCount: 10,
      reportDataCount: 10,
    });

    // Assert: 監査ログに記録されたイベントを検証

    // ①『AIエージェント実行開始』イベント
    const startEvent = auditLog[0];
    expect(startEvent).toBeDefined();
    expect(startEvent.eventId).toMatch(/^evt_[a-f0-9]{16}$/);
    expect(startEvent.transactionId).toBe(txId);
    expect(startEvent.timestamp).toBe('2024-01-15T08:00:00Z');
    expect(startEvent.actionId).toBe('INIT');
    expect(startEvent.statusCode).toBe('SUCCESS');
    expect(startEvent.executorId).toBe(executorId);
    expect(startEvent.relatedResourceId).toMatch(/^res_init_/);

    // ②『導入スケジュール案生成完了』イベント
    const action1Event = auditLog[1];
    expect(action1Event).toBeDefined();
    expect(action1Event.actionId).toBe('A1');
    expect(action1Event.statusCode).toBe('SUCCESS');
    expect(action1Event.transactionId).toBe(txId);
    expect(action1Event.details?.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(action1Event.details?.promptVersion).toBe('ACTION_01_PROMPT_VERSION');

    // ③『部長向け研修資料生成完了』イベント
    const action2Event = auditLog[2];
    expect(action2Event).toBeDefined();
    expect(action2Event.actionId).toBe('A2');
    expect(action2Event.statusCode).toBe('SUCCESS');
    expect(action2Event.transactionId).toBe(txId);
    expect(action2Event.relatedResourceId).toMatch(/^res_guide_[a-f0-9]{8}$/);

    // ④『エンジニア向け研修教材生成完了』イベント
    const action3Event = auditLog[3];
    expect(action3Event).toBeDefined();
    expect(action3Event.actionId).toBe('A3');
    expect(action3Event.statusCode).toBe('SUCCESS');
    expect(action3Event.transactionId).toBe(txId);
    expect(action3Event.details?.targetCount).toBe(10);
    expect(action3Event.details?.version).toBe('ACTION_03_PROMPT_VERSION');

    // ⑤『初回報告データ分析完了』イベント
    const action4Event = auditLog[4];
    expect(action4Event).toBeDefined();
    expect(action4Event.actionId).toBe('A4');
    expect(action4Event.statusCode).toBe('SUCCESS');
    expect(action4Event.transactionId).toBe(txId);
    expect(action4Event.details?.analyzedRecords).toBe(10);
    expect(action4Event.details?.evaluationVersion).toMatch(/^v\d+\.\d+\.\d+$/);

    // ⑥『フィードバック案作成完了』イベント
    const action5Event = auditLog[5];
    expect(action5Event).toBeDefined();
    expect(action5Event.actionId).toBe('A5');
    expect(action5Event.statusCode).toBe('SUCCESS');
    expect(action5Event.transactionId).toBe(txId);
    expect(action5Event.relatedResourceId).toMatch(/^res_feedback_[a-f0-9]{16}$/);
    expect(action5Event.details?.affectedMemberCount).toBe(10);

    // ⑦『部長による承認実施』イベント
    const approvalEvent = auditLog[6];
    expect(approvalEvent).toBeDefined();
    expect(approvalEvent.actionId).toBe('APPROVAL');
    expect(approvalEvent.statusCode).toBe('APPROVED');
    expect(approvalEvent.transactionId).toBe(txId);
    expect(approvalEvent.executorId).toBe('manager_001');
    expect(approvalEvent.details?.approverRole).toBe('Manager');
    expect(approvalEvent.details?.approvedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // ⑧『フィードバック自動配信完了』イベント
    const action6Event = auditLog[7];
    expect(action6Event).toBeDefined();
    expect(action6Event.actionId).toBe('A6');
    expect(action6Event.statusCode).toBe('SUCCESS');
    expect(action6Event.transactionId).toBe(txId);
    expect(action6Event.details?.distributedMemberCount).toBe(10);
    expect(action6Event.details?.distributedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // ⑨『AIエージェント実行完了』イベント
    const completeEvent = auditLog[8];
    expect(completeEvent).toBeDefined();
    expect(completeEvent.actionId).toBe('COMPLETE');
    expect(completeEvent.statusCode).toBe('SUCCESS');
    expect(completeEvent.transactionId).toBe(txId);
    expect(completeEvent.details?.totalDuration).toMatch(/^\d+\.\d{2}sec$/);
    expect(completeEvent.details?.finalStatus).toBe('COMPLETED');

    // 監査ログ全体の整合性検証

    // ログ総数は9件
    expect(auditLog).toHaveLength(9);

    // 各イベントは一意のeventIdを持つ
    const eventIds = auditLog.map(e => e.eventId);
    const uniqueEventIds = new Set(eventIds);
    expect(uniqueEventIds.size).toBe(9);

    // すべてのイベントが同じtransactionIdを持つ
    auditLog.forEach(event => {
      expect(event.transactionId).toBe(txId);
    });

    // すべてのイベントがtimestampを持つ
    auditLog.forEach(event => {
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    // すべてのイベントがactionIdを持つ
    auditLog.forEach(event => {
      expect(event.actionId).toBeTruthy();
      expect(event.actionId).not.toBe('');
    });

    // すべてのイベントがstatusCoreを持つ
    auditLog.forEach(event => {
      expect(['SUCCESS', 'APPROVED', 'COMPLETED']).toContain(event.statusCode);
    });

    // すべてのイベントがexecutorIdを持つ
    auditLog.forEach(event => {
      expect(event.executorId).toBeTruthy();
      expect(event.executorId).not.toBe('');
    });

    // すべてのイベントがrelatedResourceIdを持つ
    auditLog.forEach(event => {
      expect(event.relatedResourceId).toBeTruthy();
      expect(event.relatedResourceId).not.toBe('');
    });

    // タイムスタンプが時系列順であることを確認
    for (let i = 0; i < auditLog.length - 1; i++) {
      const current = new Date(auditLog[i].timestamp).getTime();
      const next = new Date(auditLog[i + 1].timestamp).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }

    // アクション順序が正しいことを確認
    const actionSequence = auditLog.map(e => e.actionId);
    expect(actionSequence).toEqual(['INIT', 'A1', 'A2', 'A3', 'A4', 'A5', 'APPROVAL', 'A6', 'COMPLETE']);

    // ダッシュボード結果の戻り値を検証
    expect(dashboardData).toBeDefined();
    expect(dashboardData.status).toBe('COMPLETED');
    expect(dashboardData.auditLogCount).toBe(9);
    expect(dashboardData.transactionId).toBe(txId);
    expect(dashboardData.successfulActions).toBe(7); // A1-A6 + INIT + COMPLETE (APPROVAL は別)
    expect(dashboardData.hasApproval).toBe(true);
  });
});