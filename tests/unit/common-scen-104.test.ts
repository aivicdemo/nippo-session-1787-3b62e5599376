import { getDashboardData } from '../../src/logic/dashboard-display';

describe('dashboard-display', () => {
  // SCEN-104: [normal] 課題抽出から既存ツール連携・確認までの自律実行 AIエージェント
  test('getDashboardData executes complete autonomous workflow with audit logging', async () => {
    // Setup: テスト用の抽出済み課題データ（5件）
    const extracted_issues = [
      {
        id: 'issue-001',
        title: 'Database connection timeout',
        description: 'API timeout when querying user profiles',
        extracted_from: 'daily_report_2024_01_15',
      },
      {
        id: 'issue-002',
        title: 'Memory leak in cache layer',
        description: 'Memory usage increases continuously during operation',
        extracted_from: 'daily_report_2024_01_15',
      },
      {
        id: 'issue-003',
        title: 'UI rendering delay on mobile',
        description: 'Component takes 3+ seconds to render on iOS',
        extracted_from: 'daily_report_2024_01_15',
      },
      {
        id: 'issue-004',
        title: 'Missing error handling in payment module',
        description: 'No retry logic for failed payment transactions',
        extracted_from: 'daily_report_2024_01_15',
      },
      {
        id: 'issue-005',
        title: 'Intermittent authentication failures',
        description: 'JWT token validation fails randomly during peak hours',
        extracted_from: 'daily_report_2024_01_15',
      },
    ];

    // Initialize audit context
    const user_id = 'user-12345';
    const session_id = 'session-abc123def456';
    const audit_timestamp = new Date('2024-01-15T11:00:00Z');

    // Mock AI client for Tx5Imp1AiClient
    const mock_ai_client = {
      validateIssueFormat: jest.fn().mockResolvedValue({
        validated_count: 5,
        validation_status: 'PASSED',
        prompt_version: 'v1.0',
        confidence: 0.98,
      }),
      judgePriorityAndCategory: jest.fn().mockResolvedValue({
        judgement_results: [
          {
            issue_id: 'issue-001',
            priority: 'HIGH',
            category: 'Infrastructure',
            confidence_score: 0.95,
          },
          {
            issue_id: 'issue-002',
            priority: 'HIGH',
            category: 'Performance',
            confidence_score: 0.92,
          },
          {
            issue_id: 'issue-003',
            priority: 'MEDIUM',
            category: 'UX',
            confidence_score: 0.87,
          },
          {
            issue_id: 'issue-004',
            priority: 'HIGH',
            category: 'Security',
            confidence_score: 0.93,
          },
          {
            issue_id: 'issue-005',
            priority: 'HIGH',
            category: 'Security',
            confidence_score: 0.91,
          },
        ],
        prompt_version: 'v1.0',
      }),
      generateToolMappings: jest.fn().mockResolvedValue({
        mappings: [
          {
            issue_id: 'issue-001',
            jira_key: 'PROJ-101',
            asana_id: 'asana-abc001',
          },
          {
            issue_id: 'issue-002',
            jira_key: 'PROJ-102',
            asana_id: 'asana-abc002',
          },
          {
            issue_id: 'issue-003',
            jira_key: 'PROJ-103',
            asana_id: 'asana-abc003',
          },
          {
            issue_id: 'issue-004',
            jira_key: 'PROJ-104',
            asana_id: 'asana-abc004',
          },
          {
            issue_id: 'issue-005',
            jira_key: 'PROJ-105',
            asana_id: 'asana-abc005',
          },
        ],
        mapping_count: 5,
        target_tools: ['Jira', 'Asana'],
        prompt_version: 'v1.0',
      }),
      registerToExternalTools: jest.fn().mockResolvedValue({
        registered_count: 5,
        tool_results: [
          {
            issue_id: 'issue-001',
            tool_name: 'Jira',
            status: 'SUCCESS',
            issue_key: 'PROJ-101',
          },
          {
            issue_id: 'issue-002',
            tool_name: 'Jira',
            status: 'SUCCESS',
            issue_key: 'PROJ-102',
          },
          {
            issue_id: 'issue-003',
            tool_name: 'Jira',
            status: 'SUCCESS',
            issue_key: 'PROJ-103',
          },
          {
            issue_id: 'issue-004',
            tool_name: 'Jira',
            status: 'SUCCESS',
            issue_key: 'PROJ-104',
          },
          {
            issue_id: 'issue-005',
            tool_name: 'Jira',
            status: 'SUCCESS',
            issue_key: 'PROJ-105',
          },
        ],
        prompt_version: 'v1.0',
      }),
      recordCompletionStatus: jest.fn().mockResolvedValue({
        completion_count: 5,
        notification_ids: [
          'notif-001',
          'notif-002',
          'notif-003',
          'notif-004',
          'notif-005',
        ],
        timestamp: '2024-01-15T11:05:00Z',
        prompt_version: 'v1.0',
      }),
    };

    // Execute orchestration
    const result = await getDashboardData(
      {
        extracted_issues,
        user_id,
        session_id,
        audit_timestamp,
      },
      mock_ai_client
    );

    // Verify workflow completion
    expect(result.workflow_status).toBe('COMPLETED');
    expect(result.total_processed_count).toBe(5);
    expect(result.success_count).toBe(5);
    expect(result.failure_count).toBe(0);

    // Verify audit log entries exist and are in correct order
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.length).toBeGreaterThanOrEqual(7);

    // Verify audit log event sequence
    const log_entries = result.audit_log;
    expect(log_entries[0].event_type).toBe('action_start');
    expect(log_entries[0].input_data_count).toBe(5);
    expect(log_entries[0].session_id).toBe(session_id);
    expect(log_entries[0].user_id).toBe(user_id);

    // Verify Action 1: Format validation
    const action_01_entry = log_entries.find(
      (entry) => entry.action_id === 'action-01' && entry.status === 'COMPLETED'
    );
    expect(action_01_entry).toBeDefined();
    expect(action_01_entry?.validated_count).toBe(5);
    expect(action_01_entry?.prompt_version).toBe('v1.0');
    expect(action_01_entry?.timestamp).toBeDefined();

    // Verify Action 2: Priority and category judgment
    const action_02_entry = log_entries.find(
      (entry) => entry.action_id === 'action-02' && entry.status === 'COMPLETED'
    );
    expect(action_02_entry).toBeDefined();
    expect(action_02_entry?.judgement_count).toBe(5);
    expect(action_02_entry?.prompt_version).toBe('v1.0');

    const high_priority_count = result.issue_results.filter(
      (issue) => issue.priority === 'HIGH'
    ).length;
    expect(high_priority_count).toBe(4);

    // Verify Action 3: Tool mapping generation
    const action_03_entry = log_entries.find(
      (entry) => entry.action_id === 'action-03' && entry.status === 'COMPLETED'
    );
    expect(action_03_entry).toBeDefined();
    expect(action_03_entry?.mapping_count).toBe(5);
    expect(action_03_entry?.target_tools).toContain('Jira');
    expect(action_03_entry?.target_tools).toContain('Asana');

    // Verify Action 4: External tool registration
    const action_04_entry = log_entries.find(
      (entry) => entry.action_id === 'action-04' && entry.status === 'COMPLETED'
    );
    expect(action_04_entry).toBeDefined();
    expect(action_04_entry?.registered_count).toBe(5);
    expect(action_04_entry?.prompt_version).toBe('v1.0');

    // Verify all issues registered to external tools
    expect(result.issue_results.every((issue) => issue.tool_registration_status === 'SUCCESS')).toBe(true);
    expect(result.issue_results.every((issue) => issue.external_tool_id)).toBe(true);

    // Verify Action 5: Completion status recording
    const action_05_entry = log_entries.find(
      (entry) => entry.action_id === 'action-05' && entry.status === 'COMPLETED'
    );
    expect(action_05_entry).toBeDefined();
    expect(action_05_entry?.completion_count).toBe(5);
    expect(action_05_entry?.notification_ids?.length).toBe(5);

    // Verify all issues have completion status
    expect(result.issue_results.every((issue) => issue.final_status === 'COMPLETED')).toBe(true);
    expect(result.issue_results.every((issue) => issue.notification_sent === true)).toBe(true);
    expect(result.issue_results.every((issue) => issue.completion_timestamp)).toBe(true);

    // Verify workflow complete event
    const complete_entry = log_entries[log_entries.length - 1];
    expect(complete_entry.event_type).toBe('action_complete');
    expect(complete_entry.total_processed_count).toBe(5);
    expect(complete_entry.success_count).toBe(5);
    expect(complete_entry.failure_count).toBe(0);
    expect(complete_entry.session_id).toBe(session_id);

    // Verify audit log chronological order
    for (let i = 1; i < log_entries.length; i++) {
      const prev_time = new Date(log_entries[i - 1].timestamp).getTime();
      const curr_time = new Date(log_entries[i].timestamp).getTime();
      expect(curr_time).toBeGreaterThanOrEqual(prev_time);
    }

    // Verify AI client was called with correct parameters
    expect(mock_ai_client.validateIssueFormat).toHaveBeenCalledWith(
      expect.objectContaining({
        issues: extracted_issues,
      })
    );
    expect(mock_ai_client.judgePriorityAndCategory).toHaveBeenCalledTimes(1);
    expect(mock_ai_client.generateToolMappings).toHaveBeenCalledTimes(1);
    expect(mock_ai_client.registerToExternalTools).toHaveBeenCalledTimes(1);
    expect(mock_ai_client.recordCompletionStatus).toHaveBeenCalledTimes(1);

    // Verify issue result structure
    expect(result.issue_results.length).toBe(5);
    result.issue_results.forEach((issue) => {
      expect(issue.issue_id).toBeDefined();
      expect(issue.priority).toMatch(/^(HIGH|MEDIUM|LOW)$/);
      expect(issue.category).toBeDefined();
      expect(issue.tool_registration_status).toBe('SUCCESS');
      expect(issue.external_tool_id).toBeDefined();
      expect(issue.final_status).toBe('COMPLETED');
      expect(issue.notification_sent).toBe(true);
      expect(issue.completion_timestamp).toBeDefined();
    });

    // Verify execution duration is recorded
    expect(result.execution_duration_ms).toBeGreaterThan(0);
    expect(typeof result.execution_duration_ms).toBe('number');
  });
});