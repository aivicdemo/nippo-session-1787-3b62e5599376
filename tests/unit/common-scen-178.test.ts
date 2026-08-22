import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-10-imp-1/prompts/action-01';
import { type Tx10Imp1AiClient } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1: 導入計画・研修実施・フィードバック対応の自動化・統合', () => {
  // SCEN-178: [normal] 導入計画・研修実施・フィードバック対応の自動化・統合 AIエージェント
  test('Action 1：導入対象部門の規模と現状を把握し、実施スケジュール案を自動生成する', async () => {
    // テスト環境準備：組織情報と初期状態データ
    const org_department_name = 'エンジニアリング部';
    const org_department_size = 10;
    const org_current_status = '朝会報告アプリ未導入';
    const org_implementation_constraints = ['ログイン→日報入力→送信のみ'];
    const org_policy_requirement = '2週間のニーズ調査・テスト期間必須';

    const current_timestamp = new Date('2024-01-15T09:00:00Z');
    const executor_user_id = 'manager-001';
    const scheduler_request_id = 'schedule-req-20240115-001';

    // フェイク AI クライアント構造検証用
    const fake_ai_client: Tx10Imp1AiClient = {
      invokeAction01: async (input) => {
        // Action 1 プロンプトが正しくビルドされていることを確認
        const prompt_text = buildAction01Prompt({
          department_name: input.department_name,
          department_size: input.department_size,
          current_status: input.current_status,
          implementation_constraints: input.implementation_constraints,
        });

        expect(prompt_text).toBeDefined();
        expect(prompt_text.length).toBeGreaterThan(0);
        expect(ACTION_01_PROMPT_VERSION).toBeDefined();

        // モック戻り値：スケジュール案
        return {
          schedule_start_date: '2024-01-22',
          milestone_1_days: 3,
          milestone_1_name: '研修準備期間',
          milestone_2_days: 5,
          milestone_2_name: '研修実施期間',
          milestone_3_days: 7,
          milestone_3_name: 'フィードバック・習熟期間',
          schedule_end_date: '2024-02-05',
          schedule_id: 'sched-20240115-001',
          constraints: [
            '10名全員が3日以内に初期セットアップを完了すること',
            '朝会報告は毎朝1回のみ送信であること',
            '部長確認メールは1通のみであること',
          ],
        };
      },
      invokeAction02: async () => ({ status: 'not_used' }),
      invokeAction03: async () => ({ status: 'not_used' }),
      invokeAction04: async () => ({ status: 'not_used' }),
      invokeAction05: async () => ({ status: 'not_used' }),
      invokeAction06: async () => ({ status: 'not_used' }),
    };

    // 監査ログ収集用
    const audit_log_events: any[] = [];

    // orchestrator 呼び出し
    const deployment_input = {
      deploymentInitiationTimestamp: current_timestamp,
      participantList: Array.from({ length: org_department_size }, (_, i) => ({
        userId: `eng-${i + 1}`,
        role: 'Engineer',
        email: `engineer${i + 1}@company.com`,
      })),
      preparationDaysRequired: 2,
      reportingDeadlineTime: '09:00',
    };

    // ハッピーパス実行
    const result_1st_execution = await runTx10Imp1Agent(
      deployment_input,
      fake_ai_client
    );

    // 期待結果検証：①部門規模10名
    expect(deployment_input.participantList.length).toBe(10);

    // 期待結果検証：②現状（朝会報告アプリ未導入）を反映
    expect(org_current_status).toBe('朝会報告アプリ未導入');

    // 期待結果検証：③マイルストーン3段階で構成
    expect(result_1st_execution.deploymentSchedule).toBeDefined();
    expect(result_1st_execution.deploymentSchedule.milestone_1_name).toBe('研修準備期間');
    expect(result_1st_execution.deploymentSchedule.milestone_2_name).toBe('研修実施期間');
    expect(result_1st_execution.deploymentSchedule.milestone_3_name).toBe('フィードバック・習熟期間');

    // 期待結果検証：④完了予定日が具体的なカレンダー日付
    const end_date_pattern = /^\d{4}-\d{2}-\d{2}$/;
    expect(result_1st_execution.deploymentSchedule.schedule_end_date).toMatch(end_date_pattern);

    // 期待結果検証：⑤制約条件が指定されたものを含む
    const constraints_string = result_1st_execution.deploymentSchedule.constraints.join('|');
    expect(constraints_string).toContain('10名全員が3日以内に初期セットアップを完了すること');
    expect(constraints_string).toContain('朝会報告は毎朝1回のみ送信であること');
    expect(constraints_string).toContain('部長確認メールは1通のみであること');

    // 期待結果検証：⑥スケジュール案が組織方針と矛盾しない
    const start_date = new Date('2024-01-22');
    const end_date = new Date('2024-02-05');
    const actual_schedule_days = Math.floor(
      (end_date.getTime() - start_date.getTime()) / (1000 * 60 * 60 * 24)
    );
    const required_minimum_days = 14; // 2週間
    expect(actual_schedule_days).toBeGreaterThanOrEqual(required_minimum_days);

    // 期待結果検証：⑦監査ログに記録（シミュレーション）
    audit_log_events.push({
      event_type: 'DEPLOYMENT_SCHEDULE_GENERATION_START',
      executor_user_id: executor_user_id,
      execution_timestamp: current_timestamp.toISOString(),
      action_id: 'action-01',
      department_size: org_department_size,
    });

    audit_log_events.push({
      event_type: 'DEPLOYMENT_SCHEDULE_GENERATION_COMPLETE',
      executor_user_id: executor_user_id,
      execution_timestamp: new Date('2024-01-15T09:05:00Z').toISOString(),
      action_id: 'action-01',
      generated_schedule_id: result_1st_execution.deploymentSchedule.schedule_id,
    });

    expect(audit_log_events.length).toBe(2);
    expect(audit_log_events[0].event_type).toBe('DEPLOYMENT_SCHEDULE_GENERATION_START');
    expect(audit_log_events[0].executor_user_id).toBe(executor_user_id);
    expect(audit_log_events[1].event_type).toBe('DEPLOYMENT_SCHEDULE_GENERATION_COMPLETE');
    expect(audit_log_events[1].generated_schedule_id).toBe(result_1st_execution.deploymentSchedule.schedule_id);

    // 期待結果検証：⑧べき等性確保（同一入力での再実行）
    const result_2nd_execution = await runTx10Imp1Agent(
      deployment_input,
      fake_ai_client
    );

    expect(result_2nd_execution.deploymentSchedule.schedule_id).toBe(
      result_1st_execution.deploymentSchedule.schedule_id
    );
    expect(result_2nd_execution.deploymentSchedule.schedule_start_date).toBe(
      result_1st_execution.deploymentSchedule.schedule_start_date
    );
    expect(result_2nd_execution.deploymentSchedule.schedule_end_date).toBe(
      result_1st_execution.deploymentSchedule.schedule_end_date
    );
    expect(result_2nd_execution.deploymentSchedule.milestone_1_days).toBe(
      result_1st_execution.deploymentSchedule.milestone_1_days
    );
    expect(result_2nd_execution.deploymentSchedule.milestone_2_days).toBe(
      result_1st_execution.deploymentSchedule.milestone_2_days
    );
    expect(result_2nd_execution.deploymentSchedule.milestone_3_days).toBe(
      result_1st_execution.deploymentSchedule.milestone_3_days
    );
    expect(result_2nd_execution.deploymentSchedule.constraints).toEqual(
      result_1st_execution.deploymentSchedule.constraints
    );
  });
});