import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { type Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-02';

describe('tx-4-imp-1: ダッシュボード分析から課題指示までの自動実行 AIエージェント', () => {
  // SCEN-3130
  test('should extract detected issues correctly when identifying progress delays, unsubmitted reports, and anomalies', async () => {
    const execution_start_time = new Date('2024-01-15T09:00:00Z');
    const execution_end_time = new Date('2024-01-15T09:02:30Z');

    const mock_ai_client: Tx4Imp1AiClient = {
      callAction02ExtractIssues: jest.fn().mockResolvedValue({
        extracted_issues: [
          {
            issue_id: 'tx2_iss_001',
            type: '進捗遅延',
            detected_value: '5日超過',
            severity: 'High',
            source_system: '進捗管理システム',
            detection_timestamp: new Date('2024-01-15T08:55:00Z'),
            detection_rule_version: '1.0.0',
            confidence_score: 92,
          },
          {
            issue_id: 'tx2_iss_002',
            type: '未提出',
            detected_value: '日報未提出（期限+2日）',
            severity: 'Medium',
            affected_member_count: 5,
            source_system: '日報入力システム',
            detection_timestamp: new Date('2024-01-15T08:50:00Z'),
            detection_rule_version: '1.0.0',
            confidence_score: 85,
          },
          {
            issue_id: 'tx2_iss_003',
            type: '異常値',
            detected_value: '進捗率-45%',
            severity: 'High',
            previous_value: '+12%',
            source_system: 'ダッシュボード',
            detection_timestamp: new Date('2024-01-15T08:52:00Z'),
            detection_rule_version: '1.0.0',
            confidence_score: 78,
          },
        ],
        action_metadata: {
          action_number: 2,
          prompt_version: ACTION_02_PROMPT_VERSION,
          execution_started_at: execution_start_time,
          execution_completed_at: execution_end_time,
        },
      }),
      callAction01AggregateProgressData: jest.fn().mockResolvedValue({}),
      callAction03ClassifyAndAssignPriority: jest.fn().mockResolvedValue({}),
      callAction04GenerateDashboardReport: jest.fn().mockResolvedValue({}),
      callAction05CreateMorningMeetingMaterial: jest.fn().mockResolvedValue({}),
      callAction06ExtractUnsubmittedMembers: jest.fn().mockResolvedValue({}),
      callAction07SendNotificationToManager: jest.fn().mockResolvedValue({}),
    };

    const request_payload = {
      team_id: 'team_dev_001',
      manager_id: 'mgr_001',
      report_date: '2024-01-15',
      meeting_start_time: '09:30',
    };

    const action_02_prompt = buildAction02Prompt({
      progress_delays: [
        {
          project_id: 'proj_001',
          days_overdue: 5,
          expected_completion_date: new Date('2024-01-10T23:59:59Z'),
        },
        {
          project_id: 'proj_002',
          days_overdue: 3,
          expected_completion_date: new Date('2024-01-12T23:59:59Z'),
        },
        {
          project_id: 'proj_003',
          days_overdue: 1,
          expected_completion_date: new Date('2024-01-14T23:59:59Z'),
        },
      ],
      unsubmitted_reports: [
        {
          member_id: 'mem_001',
          report_due_date: new Date('2024-01-13T09:00:00Z'),
        },
        {
          member_id: 'mem_002',
          report_due_date: new Date('2024-01-13T09:00:00Z'),
        },
        {
          member_id: 'mem_003',
          report_due_date: new Date('2024-01-13T09:00:00Z'),
        },
        {
          member_id: 'mem_004',
          report_due_date: new Date('2024-01-13T09:00:00Z'),
        },
        {
          member_id: 'mem_005',
          report_due_date: new Date('2024-01-13T09:00:00Z'),
        },
      ],
      anomalies: [
        {
          metric_name: 'progress_rate',
          current_value: -45,
          previous_value: 12,
          threshold: -30,
        },
      ],
    });

    expect(ACTION_02_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_02_PROMPT_VERSION).toBe('string');
    expect(action_02_prompt).toBeDefined();
    expect(typeof action_02_prompt).toBe('string');

    const result = await runTx4Imp1Agent(request_payload, mock_ai_client);

    expect(result).toBeDefined();
    expect(result.execution_id).toBeDefined();
    expect(typeof result.execution_id).toBe('string');

    expect(result.extracted_issues).toBeDefined();
    expect(Array.isArray(result.extracted_issues)).toBe(true);
    expect(result.extracted_issues).toHaveLength(3);

    const issue_001 = result.extracted_issues.find((iss) => iss.issue_id === 'tx2_iss_001');
    expect(issue_001).toBeDefined();
    expect(issue_001?.type).toBe('進捗遅延');
    expect(issue_001?.detected_value).toBe('5日超過');
    expect(issue_001?.severity).toBe('High');
    expect(issue_001?.source_system).toBe('進捗管理システム');
    expect(issue_001?.detection_timestamp).toEqual(new Date('2024-01-15T08:55:00Z'));
    expect(issue_001?.detection_rule_version).toBe('1.0.0');
    expect(issue_001?.confidence_score).toBe(92);
    expect(issue_001?.confidence_score).toBeGreaterThanOrEqual(70);

    const issue_002 = result.extracted_issues.find((iss) => iss.issue_id === 'tx2_iss_002');
    expect(issue_002).toBeDefined();
    expect(issue_002?.type).toBe('未提出');
    expect(issue_002?.detected_value).toBe('日報未提出（期限+2日）');
    expect(issue_002?.severity).toBe('Medium');
    expect(issue_002?.affected_member_count).toBe(5);
    expect(issue_002?.source_system).toBe('日報入力システム');
    expect(issue_002?.detection_timestamp).toEqual(new Date('2024-01-15T08:50:00Z'));
    expect(issue_002?.detection_rule_version).toBe('1.0.0');
    expect(issue_002?.confidence_score).toBe(85);
    expect(issue_002?.confidence_score).toBeGreaterThanOrEqual(70);

    const issue_003 = result.extracted_issues.find((iss) => iss.issue_id === 'tx2_iss_003');
    expect(issue_003).toBeDefined();
    expect(issue_003?.type).toBe('異常値');
    expect(issue_003?.detected_value).toBe('進捗率-45%');
    expect(issue_003?.severity).toBe('High');
    expect(issue_003?.previous_value).toBe('+12%');
    expect(issue_003?.source_system).toBe('ダッシュボード');
    expect(issue_003?.detection_timestamp).toEqual(new Date('2024-01-15T08:52:00Z'));
    expect(issue_003?.detection_rule_version).toBe('1.0.0');
    expect(issue_003?.confidence_score).toBe(78);
    expect(issue_003?.confidence_score).toBeGreaterThanOrEqual(70);

    expect(result.audit_log).toBeDefined();
    expect(result.audit_log).toContainEqual(
      expect.objectContaining({
        action_number: 2,
        execution_started_at: execution_start_time,
        execution_completed_at: execution_end_time,
        extracted_issue_count: 3,
        status: 'success',
      })
    );

    expect(mock_ai_client.callAction02ExtractIssues).toHaveBeenCalledTimes(1);
  });
});