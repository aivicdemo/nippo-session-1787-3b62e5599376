import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendSummaryEmail } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  // SCEN-051: AI出力が不正・曖昧・低確信度の場合、エスカレーション処理を実行
  test('should escalate to manual review when AI output has low confidence or malformed structure', async () => {
    // Setup: フェイクAIクライアントを用意
    const mockAiClient = {
      action01_collectDailyReports: jest.fn().mockResolvedValue({
        status: 'success',
        collected_reports: [
          {
            member_id: 'user_001',
            member_name: '田中太郎',
            report_date: '2024-01-15',
            content: 'プロジェクトA進捗80%、予定通り',
          },
          {
            member_id: 'user_002',
            member_name: '佐藤花子',
            report_date: '2024-01-15',
            content: 'システム不具合発生、対応中',
          },
        ],
        non_submitted_members: ['user_003'],
      }),
      action02_unifyFormat: jest.fn().mockResolvedValue({
        status: 'success',
        unified_reports: [
          {
            member_id: 'user_001',
            member_name: '田中太郎',
            report_date: '2024-01-15',
            actual_results: 'プロジェクトA進捗80%',
            issues: [],
            format_version: 'v1.0',
          },
          {
            member_id: 'user_002',
            member_name: '佐藤花子',
            report_date: '2024-01-15',
            actual_results: 'システム対応中',
            issues: ['システム不具合'],
            format_version: 'v1.0',
          },
        ],
      }),
      action03_extractIssues: jest.fn().mockResolvedValue({
        status: 'error',
        extracted_issues: [
          {
            issue_id: 'issue_001',
            description: '優先度: 中程度', // 不正: 数値ではなく文字列
            priority: 'middle', // 不正: 定義済みカテゴリではない値
            confidence_score: 0.25, // 低信頼度: 閾値0.5未満
          },
        ],
        validation_errors: ['Invalid priority value: middle', 'Confidence score below threshold'],
      }),
      action04_assignPriority: jest.fn(),
      action05_generateReport: jest.fn(),
      action06_deliverEmail: jest.fn(),
    };

    // 日報データセット（Action 2完了後の状態）
    const unifiedReports = [
      {
        member_id: 'user_001',
        member_name: '田中太郎',
        report_date: '2024-01-15',
        actual_results: 'プロジェクトA進捗80%',
        issues: [],
        format_version: 'v1.0',
      },
      {
        member_id: 'user_002',
        member_name: '佐藤花子',
        report_date: '2024-01-15',
        actual_results: 'システム対応中',
        issues: ['システム不具合'],
        format_version: 'v1.0',
      },
    ];

    // sendSummaryEmail を呼び出し
    const result = await sendSummaryEmail(
      unifiedReports,
      mockAiClient,
      'director@company.example.com',
      '2024-01-15T09:00:00Z',
    );

    // Validation: エスカレーション処理が実行されたか確認
    expect(result).toEqual({
      status: 'escalated',
      escalation_reason: 'low_confidence_ai_output',
      affected_action: 3,
      human_review_required: true,
      fallback_email_sent_to_director: true,
      manual_review_request_sent_at: expect.any(String),
      validation_failed_issues: [
        {
          issue_id: 'issue_001',
          description: '優先度: 中程度',
          priority: 'middle',
          confidence_score: 0.25,
          failure_reason: 'Confidence score 0.25 < threshold 0.5; Invalid priority value',
        },
      ],
      affected_members: ['佐藤花子'],
    });

    // Validation: Action 3の実行が記録されているか
    expect(mockAiClient.action03_extractIssues).toHaveBeenCalledWith(unifiedReports);

    // Validation: Action 6（自動配信）がスキップされているか
    expect(mockAiClient.action06_deliverEmail).not.toHaveBeenCalled();

    // Validation: 手動確認要求メールの内容構造が正しいか
    expect(result.manual_review_request_email_content).toMatch(/手動確認をお願いします/);
    expect(result.manual_review_request_email_content).toMatch(/信頼度が不足しています/);
    expect(result.manual_review_request_email_content).toMatch(/佐藤花子/);
    expect(result.manual_review_request_email_content).toMatch(/issue_001/);

    // Validation: ログイベントにエスカレーション理由が記録されているか
    expect(result.audit_log).toContainEqual({
      event_type: 'action_validation_failed',
      action_number: 3,
      timestamp: expect.any(String),
      reason: 'Confidence score 0.25 < threshold 0.5; Invalid priority value',
      escalation_chain: ['action_03'],
    });

    // Validation: 不正な課題抽出結果が朝会資料に含まれていないか
    expect(result.morning_briefing_report_generated).toBe(false);
    expect(result.issues_in_briefing).toHaveLength(0);
  });
});