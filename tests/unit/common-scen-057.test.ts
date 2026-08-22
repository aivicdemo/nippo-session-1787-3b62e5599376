import { extractAndRankIssues } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization', () => {
  // SCEN-057
  test('should extract and rank issues from aggregated daily reports without manager approval', async () => {
    // Arrange: モック日報集約データ（3件の通常案件）
    const aggregated_report_data = [
      {
        report_id: 'rep_001',
        member_id: 'mem_001',
        submitted_at: '2024-01-15T09:00:00Z',
        content: {
          results: 'Completed API integration testing',
          issues: 'Database connection timeout occurred twice',
          tomorrow_plan: 'Deploy to staging environment',
        },
      },
      {
        report_id: 'rep_002',
        member_id: 'mem_002',
        submitted_at: '2024-01-15T09:15:00Z',
        content: {
          results: 'Code review completed for authentication module',
          issues: 'Need more resources for regression testing',
          tomorrow_plan: 'Finalize authentication implementation',
        },
      },
      {
        report_id: 'rep_003',
        member_id: 'mem_003',
        submitted_at: '2024-01-15T09:30:00Z',
        content: {
          results: 'Process documentation updated',
          issues: 'Same deployment process issue as last week',
          tomorrow_plan: 'Implement automated deployment workflow',
        },
      },
    ];

    // モック AI クライアント実装
    const mock_ai_client = {
      // Action 1: 課題キーワード抽出
      callAction01ExtractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'Database connection timeout', report_id: 'rep_001' },
        { keyword: 'Resource shortage', report_id: 'rep_002' },
        { keyword: 'Deployment process problem', report_id: 'rep_003' },
      ]),

      // Action 2: カテゴリ分類
      callAction02ClassifyCategory: jest.fn().mockResolvedValue([
        {
          keyword: 'Database connection timeout',
          category: 'System Failure',
          report_id: 'rep_001',
        },
        {
          keyword: 'Resource shortage',
          category: 'Resource Shortage',
          report_id: 'rep_002',
        },
        {
          keyword: 'Deployment process problem',
          category: 'Process Improvement',
          report_id: 'rep_003',
        },
      ]),

      // Action 3: 優先度自動判定
      callAction03JudgePriority: jest.fn().mockResolvedValue([
        {
          keyword: 'Database connection timeout',
          category: 'System Failure',
          priority: 'high',
          impact_scope: 'API service availability',
          urgency_score: 9,
          recurrence_risk: 'medium',
          report_id: 'rep_001',
        },
        {
          keyword: 'Resource shortage',
          category: 'Resource Shortage',
          priority: 'medium',
          impact_scope: 'Testing coverage',
          urgency_score: 6,
          recurrence_risk: 'low',
          report_id: 'rep_002',
        },
        {
          keyword: 'Deployment process problem',
          category: 'Process Improvement',
          priority: 'medium',
          impact_scope: 'Deployment efficiency',
          urgency_score: 5,
          recurrence_risk: 'high',
          report_id: 'rep_003',
        },
      ]),

      // Action 4: 優先度別一覧生成
      callAction04GenerateList: jest.fn().mockResolvedValue({
        high: [
          {
            keyword: 'Database connection timeout',
            category: 'System Failure',
            priority: 'high',
            impact_scope: 'API service availability',
            urgency_score: 9,
            recurrence_risk: 'medium',
            report_id: 'rep_001',
          },
        ],
        medium: [
          {
            keyword: 'Resource shortage',
            category: 'Resource Shortage',
            priority: 'medium',
            impact_scope: 'Testing coverage',
            urgency_score: 6,
            recurrence_risk: 'low',
            report_id: 'rep_002',
          },
          {
            keyword: 'Deployment process problem',
            category: 'Process Improvement',
            priority: 'medium',
            impact_scope: 'Deployment efficiency',
            urgency_score: 5,
            recurrence_risk: 'high',
            report_id: 'rep_003',
          },
        ],
        low: [],
      }),

      // Action 5: メール送信
      callAction05SendEmail: jest.fn().mockResolvedValue({
        to: 'manager@company.com',
        subject: 'Priority-Ranked Issue List',
        body: 'High Priority: Database connection timeout (API service availability, urgency: 9/10)\nMedium Priority: Resource shortage (Testing coverage, urgency: 6/10), Deployment process problem (Deployment efficiency, urgency: 5/10)',
        status: 'sent',
        sent_at: '2024-01-15T10:00:00Z',
      }),
    };

    // Act: extractAndRankIssues 実行
    const result = await extractAndRankIssues(
      aggregated_report_data,
      mock_ai_client
    );

    // Assert: 各 Action が正しい順序で呼ばれたことを確認
    expect(mock_ai_client.callAction01ExtractKeywords).toHaveBeenCalledTimes(1);
    expect(mock_ai_client.callAction02ClassifyCategory).toHaveBeenCalledTimes(1);
    expect(mock_ai_client.callAction03JudgePriority).toHaveBeenCalledTimes(1);
    expect(mock_ai_client.callAction04GenerateList).toHaveBeenCalledTimes(1);
    expect(mock_ai_client.callAction05SendEmail).toHaveBeenCalledTimes(1);

    // 抽出課題が3件であること
    expect(result.processed_issue_count).toBe(3);

    // 優先度別分類が正しく行われたことを確認
    expect(result.prioritized_list.high).toHaveLength(1);
    expect(result.prioritized_list.high[0].keyword).toBe(
      'Database connection timeout'
    );
    expect(result.prioritized_list.high[0].priority).toBe('high');
    expect(result.prioritized_list.high[0].urgency_score).toBe(9);

    expect(result.prioritized_list.medium).toHaveLength(2);
    expect(result.prioritized_list.medium[0].keyword).toBe('Resource shortage');
    expect(result.prioritized_list.medium[0].priority).toBe('medium');
    expect(result.prioritized_list.medium[1].keyword).toBe(
      'Deployment process problem'
    );
    expect(result.prioritized_list.medium[1].priority).toBe('medium');

    expect(result.prioritized_list.low).toHaveLength(0);

    // メール送信ステータスが 'sent' であること
    expect(result.email_status).toBe('sent');
    expect(result.email_sent_at).toBe('2024-01-15T10:00:00Z');

    // 監査情報が記録されたことを確認
    expect(result.audit_info).toBeDefined();
    expect(result.audit_info.executed_at).toBe('2024-01-15T10:00:00Z');
    expect(result.audit_info.user_id).toBe('system_agent');
    expect(result.audit_info.action_results).toHaveLength(5);
    expect(result.audit_info.action_results[0].action_number).toBe(1);
    expect(result.audit_info.action_results[0].status).toBe('completed');
    expect(result.audit_info.action_results[1].action_number).toBe(2);
    expect(result.audit_info.action_results[1].status).toBe('completed');
    expect(result.audit_info.action_results[2].action_number).toBe(3);
    expect(result.audit_info.action_results[2].status).toBe('completed');
    expect(result.audit_info.action_results[3].action_number).toBe(4);
    expect(result.audit_info.action_results[3].status).toBe('completed');
    expect(result.audit_info.action_results[4].action_number).toBe(5);
    expect(result.audit_info.action_results[4].status).toBe('completed');

    // 全処理が管理者承認を待たずに完結したことを確認
    expect(result.completion_status).toBe('completed_without_approval');
  });
});