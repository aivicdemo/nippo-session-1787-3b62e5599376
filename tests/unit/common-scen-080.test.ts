import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-080: [error] ダッシュボード分析から課題指示までの自動実行 AIエージェント - 複数部門にまたがる課題の場合
  test('should escalate and halt side effects when multi-department issue is detected before committing pending actions', async () => {
    const mock_ai_client = {
      action_01_get_dashboard_data: jest.fn().mockResolvedValue({
        teams: [
          { team_id: 'sales', team_name: '営業部' },
          { team_id: 'manufacturing', team_name: '製造部' },
          { team_id: 'planning', team_name: '企画部' }
        ],
        submission_status: [
          { member_id: 'M001', submitted: true },
          { member_id: 'M002', submitted: false }
        ],
        issues: [
          {
            issue_id: 'I001',
            title: 'カスタマー要件変更による納期調整',
            affected_teams: ['sales', 'manufacturing', 'planning'],
            severity: 'high',
            reported_at: '2024-01-15T10:30:00Z'
          }
        ]
      }),

      action_02_extract_issues: jest.fn().mockResolvedValue({
        extracted_issues: [
          {
            issue_key: 'I001',
            title: 'カスタマー要件変更による納期調整',
            affected_teams: ['sales', 'manufacturing', 'planning'],
            department_count: 3,
            description: '要件変更に伴う納期短縮対応が必要'
          }
        ]
      }),

      action_03_check_past_issues: jest.fn().mockResolvedValue({
        similar_issues: [
          {
            past_issue_id: 'PI001',
            title: '納期調整',
            resolution_time_days: 2
          }
        ],
        recurrence_risk_score: 0.75
      }),

      action_04_prioritize_issues: jest.fn().mockResolvedValue({
        prioritized_issues: [
          {
            issue_key: 'I001',
            priority_level: 'critical',
            urgency: 'immediate',
            is_multi_department: true,
            affected_department_count: 3,
            escalation_required: true
          }
        ],
        escalation_condition_met: 'MULTI_DEPARTMENT_ISSUE'
      }),

      action_05_generate_response_plan: jest.fn(),
      action_06_create_presentation_material: jest.fn(),
      action_07_extract_unsubmitted_members: jest.fn()
    };

    const pending_actions_expected = ['action-05', 'action-06', 'action-07'];
    const escalation_reason = 'MULTI_DEPARTMENT_ISSUE';
    const side_effect_status = 'NOT_COMMITTED';
    const human_handoff_required = true;

    const result = await detectAndNotifyUnsubmitted(
      {
        dashboard_request_id: 'REQ-001',
        triggered_at: '2024-01-15T10:30:00Z',
        analysis_scope: 'daily'
      },
      mock_ai_client
    );

    expect(result.escalation_reason).toBe(escalation_reason);
    expect(result.pending_actions).toEqual(pending_actions_expected);
    expect(result.side_effect_status).toBe(side_effect_status);
    expect(result.human_handoff_required).toBe(human_handoff_required);
    
    expect(mock_ai_client.action_01_get_dashboard_data).toHaveBeenCalled();
    expect(mock_ai_client.action_02_extract_issues).toHaveBeenCalled();
    expect(mock_ai_client.action_03_check_past_issues).toHaveBeenCalled();
    expect(mock_ai_client.action_04_prioritize_issues).toHaveBeenCalled();
    
    expect(mock_ai_client.action_05_generate_response_plan).not.toHaveBeenCalled();
    expect(mock_ai_client.action_06_create_presentation_material).not.toHaveBeenCalled();
    expect(mock_ai_client.action_07_extract_unsubmitted_members).not.toHaveBeenCalled();

    expect(result.escalation_payload).toEqual({
      issue_key: 'I001',
      title: 'カスタマー要件変更による納期調整',
      affected_teams: ['sales', 'manufacturing', 'planning'],
      priority_level: 'critical',
      requires_executive_confirmation: true
    });
  });
});