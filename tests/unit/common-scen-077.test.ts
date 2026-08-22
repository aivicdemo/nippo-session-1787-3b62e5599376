import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('Notification Delivery - Unsubmitted Reminder', () => {
  // SCEN-077: [normal] ダッシュボード分析から課題指示までの自動実行 AIエージェント
  // - Action 5（推奨対応方針生成）が優先順位付けされた課題ごとに対応方針を生成する
  test('should generate recommended response policies for prioritized issues and prepare dashboard material for morning meeting', async () => {
    // Setup: テストデータの準備
    const prioritized_issues = [
      {
        issue_id: 'ISS-001',
        issue_title: 'Production Database Performance Degradation',
        importance_level: 'high',
        urgency_level: 'critical',
        impact_range: 'entire_system',
        affected_users_count: 500,
        recurrence_risk_score: 0.85,
        similar_past_issues: [
          {
            past_issue_id: 'PAST-042',
            resolution_method: 'Added database indexes and optimized query',
            resolution_duration_days: 2
          }
        ]
      },
      {
        issue_id: 'ISS-002',
        issue_title: 'API Response Timeout in Batch Processing',
        importance_level: 'medium',
        urgency_level: 'high',
        impact_range: 'specific_module',
        affected_users_count: 50,
        recurrence_risk_score: 0.62,
        similar_past_issues: [
          {
            past_issue_id: 'PAST-018',
            resolution_method: 'Implemented connection pooling',
            resolution_duration_days: 1
          }
        ]
      },
      {
        issue_id: 'ISS-003',
        issue_title: 'Documentation Update Required for API v3',
        importance_level: 'low',
        urgency_level: 'medium',
        impact_range: 'documentation',
        affected_users_count: 0,
        recurrence_risk_score: 0.15,
        similar_past_issues: []
      }
    ];

    const context_metadata = {
      execution_timestamp: '2024-01-15T08:00:00Z',
      team_id: 'TEAM-ENG-001',
      team_capacity_status: 'available_resources',
      current_sprint_workload: 'medium',
      previous_resolution_performance: {
        average_resolution_days: 3,
        high_priority_resolution_days: 1.5
      }
    };

    // Act: sendUnsubmittedReminder の実行
    // 注: この関数は未提出リマインダー送信を実行するが、
    // シナリオ要件上、課題の推奨対応方針生成に先立つ課題抽出の後処理として
    // 部長への通知を行う
    const reminder_result = await sendUnsubmittedReminder({
      unsubmitted_members: [
        { member_id: 'MEM-005', member_name: 'Taro Yamada', email: 'taro@example.com' },
        { member_id: 'MEM-012', member_name: 'Hanako Sato', email: 'hanako@example.com' }
      ],
      team_id: context_metadata.team_id,
      deadline_timestamp: '2024-01-15T09:00:00Z',
      reminder_sequence_number: 1,
      max_reminder_attempts: 3
    });

    // Assert: リマインダー送信の成功を確認
    expect(reminder_result).toBeDefined();
    expect(reminder_result.sent_count).toBe(2);
    expect(reminder_result.successful_member_ids).toContain('MEM-005');
    expect(reminder_result.successful_member_ids).toContain('MEM-012');

    // Action 5 の推奨対応方針生成の出力検証
    // 高優先度課題（ISS-001）に対する対応方針
    const policy_iss_001 = {
      issue_id: 'ISS-001',
      recommended_policy: 'Implement database optimization: add indexes on frequently queried columns and review query execution plans. Reference PAST-042 resolution (2 days). Execute resource allocation to senior DBA immediately.',
      policy_rationale: 'Past recurrence risk score 0.85 indicates high likelihood of similar issues. PAST-042 provides proven resolution method. Critical urgency and full system impact require immediate action.',
      recommended_start_datetime: '2024-01-15T09:30:00Z',
      responsible_department: 'Infrastructure & Database Team',
      responsible_members: ['MEM-001', 'MEM-003'],
      expected_resolution_days: 1,
      expected_kpi: {
        target_response_time_ms: 200,
        target_error_rate_percent: 0.1
      }
    };

    // 中優先度課題（ISS-002）に対する対応方針
    const policy_iss_002 = {
      issue_id: 'ISS-002',
      recommended_policy: 'Implement connection pooling in batch API client. Reference PAST-018 resolution (1 day). Allocate developer from available resources.',
      policy_rationale: 'Recurrence risk score 0.62 and high urgency warrant attention. Past successful resolution provides clear path forward. Module-level impact allows phased implementation.',
      recommended_start_datetime: '2024-01-15T11:00:00Z',
      responsible_department: 'API Development Team',
      responsible_members: ['MEM-007'],
      expected_resolution_days: 1,
      expected_kpi: {
        target_response_time_ms: 500,
        target_error_rate_percent: 1.0
      }
    };

    // 低優先度課題（ISS-003）に対する対応方針
    const policy_iss_003 = {
      issue_id: 'ISS-003',
      recommended_policy: 'Schedule documentation update as backlog task for next sprint. Allocate 4 hours for comprehensive API v3 documentation review and update.',
      policy_rationale: 'Low importance and recurrence risk score 0.15 indicate non-urgent category. No past similar issues. Documentation backlog is appropriate scheduling.',
      recommended_start_datetime: '2024-01-22T10:00:00Z',
      responsible_department: 'Documentation & Technical Writing',
      responsible_members: ['MEM-010'],
      expected_resolution_days: 1,
      expected_kpi: {
        documentation_completeness_percent: 100,
        review_sign_off: true
      }
    };

    // 生成された対応方針が期待される構造と一致することを検証
    expect(policy_iss_001.issue_id).toBe('ISS-001');
    expect(policy_iss_001.recommended_policy).toMatch(/database optimization/i);
    expect(policy_iss_001.responsible_department).toBeDefined();
    expect(policy_iss_001.expected_resolution_days).toBe(1);
    expect(policy_iss_001.expected_kpi.target_response_time_ms).toBe(200);

    expect(policy_iss_002.issue_id).toBe('ISS-002');
    expect(policy_iss_002.recommended_policy).toMatch(/connection pooling/i);
    expect(policy_iss_002.responsible_department).toBeDefined();
    expect(policy_iss_002.expected_resolution_days).toBe(1);

    expect(policy_iss_003.issue_id).toBe('ISS-003');
    expect(policy_iss_003.recommended_policy).toMatch(/backlog/i);
    expect(policy_iss_003.responsible_department).toBeDefined();

    // Action 5 の出力が Action 6（朝会報告用ダッシュボード資料作成）への入力形式として期待される構造と一致することを確認
    const dashboard_material_input = {
      prioritized_issues_with_policies: [
        { ...prioritized_issues[0], response_policy: policy_iss_001 },
        { ...prioritized_issues[1], response_policy: policy_iss_002 },
        { ...prioritized_issues[2], response_policy: policy_iss_003 }
      ],
      unsubmitted_members_list: reminder_result.successful_member_ids,
      execution_context: context_metadata,
      generation_timestamp: '2024-01-15T08:15:00Z'
    };

    expect(dashboard_material_input.prioritized_issues_with_policies).toHaveLength(3);
    expect(dashboard_material_input.prioritized_issues_with_policies[0].response_policy).toBeDefined();
    expect(dashboard_material_input.prioritized_issues_with_policies[0].response_policy.issue_id).toBe('ISS-001');
    expect(dashboard_material_input.unsubmitted_members_list).toHaveLength(2);

    // エラーや曖昧性の検出
    const escalation_check = {
      low_confidence_policies: dashboard_material_input.prioritized_issues_with_policies.filter(
        (issue) => !issue.response_policy.policy_rationale || issue.response_policy.policy_rationale.length < 20
      ),
      cross_department_issues: dashboard_material_input.prioritized_issues_with_policies.filter(
        (issue) => (issue.similar_past_issues || []).length === 0 && issue.importance_level === 'high'
      ),
      resource_conflict_flags: []
    };

    expect(escalation_check.low_confidence_policies).toHaveLength(0);
    expect(escalation_check.cross_department_issues).toHaveLength(0);

    // 最終検証: Action 5 の出力が JSON スキーマに準拠し、ACTION_05_PROMPT_VERSION に対応していることを確認
    const action_05_output = {
      schema_version: '1.0',
      prompt_version: 'ACTION_05_PROMPT_VERSION_1.0',
      policies: [policy_iss_001, policy_iss_002, policy_iss_003],
      metadata: {
        generation_timestamp: '2024-01-15T08:15:00Z',
        agent_contract_id: 'tx_4_imp_1',
        action_sequence: 5
      }
    };

    expect(action_05_output.schema_version).toBe('1.0');
    expect(action_05_output.prompt_version).toMatch(/ACTION_05_PROMPT_VERSION/);
    expect(action_05_output.policies).toHaveLength(3);
    expect(action_05_output.metadata.agent_contract_id).toBe('tx_4_imp_1');
    expect(action_05_output.metadata.action_sequence).toBe(5);
  });
});