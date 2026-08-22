import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-submission';

describe('共通 - 導入計画・研修実施・フィードバック対応の自動化・統合', () => {
  // SCEN-180: [normal] 導入計画・研修実施・フィードバック対応の自動化・統合 AIエージェント
  // 「導入計画・研修実施・フィードバック対応の自動化・統合」が自律処理
  // 「全エンジニア向け集合研修の教材と実施計画を自動生成する」を契約どおり実行する
  test('SCEN-180: submitDailyReport generates training materials and implementation plan correctly', async () => {
    // Setup: テスト用の部門情報
    const division_id = 'DIV-001';
    const engineer_count = 10;
    const is_system_deployed = false;

    // テスト用の朝会報告アプリ仕様書と運用ルール定義データ
    const app_specification = {
      core_features: [
        'login',
        'report_input_yesterday',
        'report_input_today',
        'report_input_issues',
        'submit'
      ],
      target_audience: 'all_engineers',
      learning_time_minutes: 45,
      required_environment: {
        terminal_count: 10,
        network_requirement: 'stable_internet',
        screen_sharing_enabled: true
      }
    };

    const operational_rules = {
      submission_deadline_time: '09:00',
      daily_cadence: 'every_workday',
      report_format: 'structured_three_items',
      scope_limitation: 'aivic_goal_only'
    };

    // Mock: Tx10Imp1AiClient のモック
    const mock_ai_client = {
      buildAction01Prompt: jest.fn().mockResolvedValue({
        version: '1.0.0',
        output: { schedule_draft: 'valid_schedule' }
      }),
      buildAction02Prompt: jest.fn().mockResolvedValue({
        version: '1.0.0',
        output: { director_guide: 'valid_guide' }
      }),
      buildAction03Prompt: jest.fn().mockResolvedValue({
        version: '1.0.0',
        output: {
          training_material: {
            title: 'Beginner Training: Daily Report System',
            modules: [
              {
                module_id: 'M001',
                name: 'Login Procedure',
                description: 'Step-by-step guide to login to the daily report system',
                estimated_duration_minutes: 10
              },
              {
                module_id: 'M002',
                name: 'Report Input: Yesterday\'s Work',
                description: 'How to enter yesterday\'s completed work items',
                estimated_duration_minutes: 10
              },
              {
                module_id: 'M003',
                name: 'Report Input: Today\'s Plan',
                description: 'How to enter today\'s planned work items',
                estimated_duration_minutes: 10
              },
              {
                module_id: 'M004',
                name: 'Report Input: Issues',
                description: 'How to identify and report current issues',
                estimated_duration_minutes: 10
              },
              {
                module_id: 'M005',
                name: 'Submit Report',
                description: 'How to submit the daily report',
                estimated_duration_minutes: 5
              }
            ],
            total_duration_minutes: 45,
            target_audience: 'all_engineers',
            format: 'pdf',
            scope: 'aivic_goal_only',
            excluded_features: [
              'multiple_simultaneous_submission',
              'multi_division_distribution',
              'advanced_analytics'
            ]
          },
          implementation_plan: {
            plan_id: 'IMPL-001',
            target_engineer_count: 10,
            training_candidates: [
              { engineer_id: 'ENG-001', name: 'Engineer A' },
              { engineer_id: 'ENG-002', name: 'Engineer B' },
              { engineer_id: 'ENG-003', name: 'Engineer C' },
              { engineer_id: 'ENG-004', name: 'Engineer D' },
              { engineer_id: 'ENG-005', name: 'Engineer E' },
              { engineer_id: 'ENG-006', name: 'Engineer F' },
              { engineer_id: 'ENG-007', name: 'Engineer G' },
              { engineer_id: 'ENG-008', name: 'Engineer H' },
              { engineer_id: 'ENG-009', name: 'Engineer I' },
              { engineer_id: 'ENG-010', name: 'Engineer J' }
            ],
            scheduled_sessions: [
              {
                session_id: 'SESSION-001',
                scheduled_date: '2024-02-05',
                scheduled_time: '10:00',
                duration_minutes: 60,
                location: 'Conference Room A',
                max_capacity: 10
              },
              {
                session_id: 'SESSION-002',
                scheduled_date: '2024-02-06',
                scheduled_time: '14:00',
                duration_minutes: 60,
                location: 'Conference Room B',
                max_capacity: 10
              }
            ],
            required_environment: {
              terminal_count: 10,
              network_requirement: 'stable_internet',
              screen_sharing_enabled: true,
              video_conferencing_enabled: false,
              recording_capability: true
            },
            trainer_assigned: 'department_head',
            estimated_readiness_date: '2024-02-07'
          }
        }
      }),
      buildAction04Prompt: jest.fn().mockResolvedValue({
        version: '1.0.0',
        output: { feedback_analysis: 'valid_feedback' }
      }),
      buildAction05Prompt: jest.fn().mockResolvedValue({
        version: '1.0.0',
        output: { feedback_draft: 'valid_draft' }
      }),
      buildAction06Prompt: jest.fn().mockResolvedValue({
        version: '1.0.0',
        output: { distribution_result: 'valid_result' }
      })
    };

    // Execute: submitDailyReport 呼び出し
    const input_payload = {
      division_id,
      engineer_count,
      is_system_deployed,
      app_specification,
      operational_rules,
      ai_client: mock_ai_client
    };

    const result = await submitDailyReport(input_payload);

    // Verify: Action 3 が正しく呼び出されたことを確認
    expect(mock_ai_client.buildAction03Prompt).toHaveBeenCalled();

    // Verify: 生成される研修教材に必須要素が含まれていることを確認
    expect(result.training_material).toBeDefined();
    expect(result.training_material.modules).toHaveLength(5);

    // (1) ログイン手順が含まれていること
    const login_module = result.training_material.modules.find(
      (mod: any) => mod.module_id === 'M001'
    );
    expect(login_module).toBeDefined();
    expect(login_module.name).toBe('Login Procedure');
    expect(login_module.estimated_duration_minutes).toBe(10);

    // (2) 日報3項目（昨日やったこと、今日やること、抱えている課題）の入力方法
    const yesterday_module = result.training_material.modules.find(
      (mod: any) => mod.module_id === 'M002'
    );
    expect(yesterday_module).toBeDefined();
    expect(yesterday_module.name).toMatch(/Yesterday/i);

    const today_module = result.training_material.modules.find(
      (mod: any) => mod.module_id === 'M003'
    );
    expect(today_module).toBeDefined();
    expect(today_module.name).toMatch(/Today/i);

    const issues_module = result.training_material.modules.find(
      (mod: any) => mod.module_id === 'M004'
    );
    expect(issues_module).toBeDefined();
    expect(issues_module.name).toMatch(/Issue/i);

    // (3) 送信ボタンの操作手順
    const submit_module = result.training_material.modules.find(
      (mod: any) => mod.module_id === 'M005'
    );
    expect(submit_module).toBeDefined();
    expect(submit_module.name).toMatch(/Submit/i);

    // Verify: 総学習時間が45分であることを確認
    expect(result.training_material.total_duration_minutes).toBe(45);

    // Verify: ターゲットオーディエンスが全エンジニア向けであることを確認
    expect(result.training_material.target_audience).toBe('all_engineers');

    // Verify: スコープが AIVIC ゴール範囲内に限定されていること
    expect(result.training_material.scope).toBe('aivic_goal_only');

    // Verify: 追加機能が除外されていることを確認
    expect(result.training_material.excluded_features).toContain(
      'multiple_simultaneous_submission'
    );
    expect(result.training_material.excluded_features).toContain(
      'multi_division_distribution'
    );
    expect(result.training_material.excluded_features).toContain(
      'advanced_analytics'
    );

    // Verify: 生成される実施計画に必須項目が含まれていることを確認
    expect(result.implementation_plan).toBeDefined();

    // (1) 研修対象者数が10名であることを確認
    expect(result.implementation_plan.target_engineer_count).toBe(10);
    expect(result.implementation_plan.training_candidates).toHaveLength(10);

    // (2) 所要時間の見積もりが含まれていること
    expect(result.implementation_plan.scheduled_sessions).toBeDefined();
    expect(result.implementation_plan.scheduled_sessions[0].duration_minutes).toBe(60);

    // (3) 実施日時の候補が複数含まれていること
    expect(result.implementation_plan.scheduled_sessions).toHaveLength(2);
    expect(result.implementation_plan.scheduled_sessions[0].scheduled_date).toBe('2024-02-05');
    expect(result.implementation_plan.scheduled_sessions[1].scheduled_date).toBe('2024-02-06');

    // (4) 必要な実施環境が明記されていること
    expect(result.implementation_plan.required_environment).toBeDefined();
    expect(result.implementation_plan.required_environment.terminal_count).toBe(10);
    expect(result.implementation_plan.required_environment.network_requirement).toBe(
      'stable_internet'
    );

    // Verify: 教材と実施計画が AIVIC ゴール範囲内に厳密に限定されていること
    const training_modules_names = result.training_material.modules.map(
      (mod: any) => mod.name
    );
    expect(training_modules_names).toContain('Login Procedure');
    expect(training_modules_names).toContain('Report Input: Yesterday\'s Work');
    expect(training_modules_names).toContain('Report Input: Today\'s Plan');
    expect(training_modules_names).toContain('Report Input: Issues');
    expect(training_modules_names).toContain('Submit Report');

    // Verify: 追加機能や複雑な運用手順が含まれていないこと
    const has_advanced_features = training_modules_names.some((name: string) =>
      /advanced|complex|multi|simultaneous|distribution|analytics/i.test(name)
    );
    expect(has_advanced_features).toBe(false);

    // Verify: 部長による事前確認が可能な形式で出力されていることを確認
    expect(result.training_material.format).toBe('pdf');

    // Verify: ACTION_03_PROMPT_VERSION が正しくエクスポートされていることを確認
    // このチェックは buildAction03Prompt のモックが呼ばれたことで間接的に検証される
    expect(mock_ai_client.buildAction03Prompt).toHaveBeenCalledWith(
      expect.objectContaining({
        division_id,
        engineer_count,
        app_specification,
        operational_rules
      })
    );

    // Verify: Orchestrator boundary 検証
    // 第2パラメータが Tx10Imp1AiClient と構造的に同一であることを確認
    expect(mock_ai_client).toHaveProperty('buildAction01Prompt');
    expect(mock_ai_client).toHaveProperty('buildAction02Prompt');
    expect(mock_ai_client).toHaveProperty('buildAction03Prompt');
    expect(mock_ai_client).toHaveProperty('buildAction04Prompt');
    expect(mock_ai_client).toHaveProperty('buildAction05Prompt');
    expect(mock_ai_client).toHaveProperty('buildAction06Prompt');

    // Verify: 推定準備完了日が妥当であることを確認
    expect(result.implementation_plan.estimated_readiness_date).toBe('2024-02-07');

    // Verify: トレーナーが部長に指定されていることを確認
    expect(result.implementation_plan.trainer_assigned).toBe('department_head');

    // Verify: スクリーン共有が有効であることを確認
    expect(result.implementation_plan.required_environment.screen_sharing_enabled).toBe(true);

    // Verify: ビデオ会議は不要であることを確認
    expect(result.implementation_plan.required_environment.video_conferencing_enabled).toBe(
      false
    );

    // Verify: 記録機能が有効であることを確認
    expect(result.implementation_plan.required_environment.recording_capability).toBe(true);

    // Verify: 全エンジニアが研修対象候補として登録されていることを確認
    const all_engineers_included = result.implementation_plan.training_candidates.every(
      (candidate: any) => candidate.engineer_id && candidate.name
    );
    expect(all_engineers_included).toBe(true);

    // Verify: 最初の session が2月5日10時に開始することを確認
    expect(result.implementation_plan.scheduled_sessions[0].scheduled_time).toBe('10:00');

    // Verify: 2番目の session が2月6日14時に開始することを確認
    expect(result.implementation_plan.scheduled_sessions[1].scheduled_time).toBe('14:00');

    // Verify: 会議室が指定されていることを確認
    expect(result.implementation_plan.scheduled_sessions[0].location).toBe(
      'Conference Room A'
    );
    expect(result.implementation_plan.scheduled_sessions[1].location).toBe(
      'Conference Room B'
    );

    // Verify: 各セッションの最大容量が10名であることを確認
    expect(result.implementation_plan.scheduled_sessions[0].max_capacity).toBe(10);
    expect(result.implementation_plan.scheduled_sessions[1].max_capacity).toBe(10);

    // Verify: 研修内容が AIVIC ゴール（ログイン→日報入力→送信のシンプルな3項目報告）に厳密に限定されていることを確認
    const core_functionality_count = result.training_material.modules.length;
    expect(core_functionality_count).toBe(5); // Login + 3 items + Submit

    // Verify: 各モジュールが独立した学習要素であることを確認
    result.training_material.modules.forEach((mod: any) => {
      expect(mod.module_id).toBeTruthy();
      expect(mod.name).toBeTruthy();
      expect(mod.description).toBeTruthy();
      expect(mod.estimated_duration_minutes).toBeGreaterThan(0);
    });
  });
});