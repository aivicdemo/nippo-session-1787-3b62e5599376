import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('朝会報告管理システム - 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1277
  test('[error] 既存ツール課題データ連携リトライ機能 - タイムアウトと認証エラーが同時に発生した場合、認証エラーを優先的に部長へ通知する', async () => {
    const manager_id = 'manager_001';
    const extracted_issue_ids = ['issue_001', 'issue_002', 'issue_003'];
    
    const stub_ai_client: Tx5Imp1AiClient = {
      validateAndClassifyIssues: jest.fn().mockResolvedValue({
        validated_issues: [
          {
            issue_id: 'issue_001',
            priority_score: 75,
            priority_rank: 'high',
            category: 'technical_debt',
            tool_issue_id: null,
            validation_status: 'valid',
          },
          {
            issue_id: 'issue_002',
            priority_score: 50,
            priority_rank: 'medium',
            category: 'performance',
            tool_issue_id: null,
            validation_status: 'valid',
          },
          {
            issue_id: 'issue_003',
            priority_score: 30,
            priority_rank: 'low',
            category: 'documentation',
            tool_issue_id: null,
            validation_status: 'warning',
          },
        ],
        classification_confidence: 0.92,
      }),
    };

    const stub_notification_service = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        recipient_id: manager_id,
        notification_type: 'error_alert',
        message_content: 'APIキーの確認が必要です。認証エラーが発生しました。',
        delivery_status: 'sent',
        error_category: 'AuthenticationError',
        timestamp: new Date('2024-01-15T09:30:00Z').toISOString(),
      }),
    };

    const stub_text_analysis_service = {
      extractKeywords: jest.fn()
        .mockRejectedValueOnce(new Error('timeout_error_30s_exceeded'))
        .mockRejectedValueOnce(new Error('authentication_error_401_unauthorized'))
        .mockRejectedValueOnce(new Error('timeout_error_30s_exceeded'))
        .mockRejectedValueOnce(new Error('authentication_error_401_unauthorized'))
        .mockRejectedValueOnce(new Error('timeout_error_30s_exceeded'))
        .mockRejectedValueOnce(new Error('authentication_error_401_unauthorized')),
    };

    const stub_tool_integration_config = {
      tool_type: 'jira' as const,
      api_endpoint: 'https://jira.example.com/api/v2',
      api_key: 'invalid_or_expired_key',
      max_retries: 3,
      backoff_multiplier: 2,
      initial_delay_ms: 3000,
    };

    const stub_priority_rules = {
      high_threshold: 70,
      medium_threshold: 40,
      low_threshold: 0,
      frequency_weight: 0.5,
      impact_weight: 0.5,
    };

    const stub_category_mappings = [
      {
        system_category: 'technical_debt',
        tool_category: 'Tech Debt',
      },
      {
        system_category: 'performance',
        tool_category: 'Performance',
      },
      {
        system_category: 'documentation',
        tool_category: 'Docs',
      },
    ];

    const result = await runTx5Imp1Agent(
      {
        extracted_issue_ids,
        validation_mode: 'auto',
        target_tool_type: 'jira',
        project_manager_id: manager_id,
      },
      stub_ai_client,
      stub_notification_service as any,
      stub_text_analysis_service as any,
      stub_tool_integration_config,
      stub_priority_rules,
      stub_category_mappings,
    );

    expect(result.integration_result.status).toBe('retry_scheduled');
    expect(result.integration_result.retry_count).toBe(3);
    expect(result.integration_result.last_error_category).toBe('AuthenticationError');
    expect(result.integration_result.last_error_message).toMatch(/APIキー|認証/);

    expect(stub_notification_service.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_id: manager_id,
        notification_type: 'error_alert',
        error_category: 'AuthenticationError',
      }),
    );

    expect(result.execution_summary.final_status).toBe('error_with_escalation');
    expect(result.execution_summary.exception_occurred).toBe(true);
  });
});