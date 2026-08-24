import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('朝会報告管理システム月次課題傾向分析レポート生成エージェント', () => {
  // SCEN-1845
  test('失敗原因分類コードが空文字列のときエラーをthrowする', async () => {
    const trigger_timestamp = new Date('2024-01-01T09:00:00Z');
    const target_month = '2024-01';
    const manager_user_id = 'mgr_001';
    const include_detailed_analysis = true;

    const input: Tx7Imp1AgentInput = {
      triggerTimestamp: trigger_timestamp,
      targetMonth: target_month,
      managerUserId: manager_user_id,
      includeDetailedAnalysis: include_detailed_analysis,
    };

    const stub_ai_client: Tx7Imp1AiClient = {
      action01_extract_month_data: async () => ({
        month_data_records: [
          {
            record_id: 'rec_001',
            report_date: new Date('2024-01-15T08:00:00Z'),
            issue_description: 'Database connection timeout',
            failure_classification_code: '',
            issue_severity: undefined,
          },
          {
            record_id: 'rec_002',
            report_date: new Date('2024-01-20T08:00:00Z'),
            issue_description: 'API rate limit exceeded',
            failure_classification_code: '',
            issue_severity: undefined,
          },
        ],
      }),
      action02_validate_data_quality: async () => ({
        is_valid: true,
        validation_messages: [],
      }),
      action03_extract_and_classify_issues: async () => ({
        classified_issues: [],
      }),
      action04_analyze_bottleneck_trend: async () => ({
        trend_analysis: {
          timeSeriesData: [],
          improvementTrend: 'stable',
          recurringIssuePattern: [],
        },
      }),
      action05_calculate_team_metrics: async () => ({
        team_metrics: {
          issue_resolution_speed: 3.5,
          report_submission_rate: 0.85,
          issue_recurrence_rate: 0.12,
        },
      }),
      action06_generate_report_document: async () => ({
        report_content: 'Mock report content',
      }),
      action07_prepare_delivery: async () => ({
        delivery_ready: true,
      }),
      action08_confirm_delivery_completion: async () => ({
        delivery_timestamp: new Date('2024-01-01T10:00:00Z'),
      }),
    };

    await expect(() =>
      runTx7Imp1Agent(input, stub_ai_client)
    ).rejects.toThrow(/失敗原因の分類コードが未設定です/);
  });
});