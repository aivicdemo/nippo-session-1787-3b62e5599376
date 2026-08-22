import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssues } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization', () => {
  // SCEN-060: [normal] 日報集約から優先度別課題一覧提示までの自動判定・配信
  // AIエージェント - 「日報集約から優先度別課題一覧提示までの自動判定・配信」が自律処理
  // 「影響範囲・緊急度・再発リスクに基づいて優先度を自動判定する」を契約どおり実行する

  test('should extract issues from aggregated daily reports and rank them by impact scope, urgency, and recurrence risk', () => {
    const aggregated_daily_reports = [
      {
        member_id: 'M001',
        member_name: 'Alice',
        report_date: '2024-01-15',
        yesterday_results: 'Completed API integration testing. Database migration completed.',
        today_plans: 'Deploy to staging environment. Conduct performance testing.',
        issues: 'Database connection timeout issue occurred during peak load testing. Concern about resource allocation for next sprint.',
      },
      {
        member_id: 'M002',
        member_name: 'Bob',
        report_date: '2024-01-15',
        yesterday_results: 'Code review completed for authentication module.',
        today_plans: 'Merge pull requests and deploy to production.',
        issues: 'Security vulnerability detected in authentication logic. Problem with session management causing user logout.',
      },
      {
        member_id: 'M003',
        member_name: 'Charlie',
        report_date: '2024-01-15',
        yesterday_results: 'UI component refactoring completed.',
        today_plans: 'Implement responsive design for mobile.',
        issues: 'CSS styling conflict in production. Risk of regression in existing features.',
      },
      {
        member_id: 'M004',
        member_name: 'Diana',
        report_date: '2024-01-15',
        yesterday_results: 'Documentation updated for API endpoints.',
        today_plans: 'Prepare deployment checklist.',
        issues: 'Missing API documentation for new endpoints. Concern about integration testing coverage.',
      },
      {
        member_id: 'M005',
        member_name: 'Eve',
        report_date: '2024-01-15',
        yesterday_results: 'Infrastructure monitoring tools configured.',
        today_plans: 'Set up alerting thresholds.',
        issues: 'Server memory usage exceeded threshold twice this week. Problem with log rotation affecting disk space.',
      },
      {
        member_id: 'M006',
        member_name: 'Frank',
        report_date: '2024-01-15',
        yesterday_results: 'Test automation framework setup completed.',
        today_plans: 'Write integration test cases.',
        issues: 'Flaky test cases causing build failures. Concern about test environment configuration.',
      },
      {
        member_id: 'M007',
        member_name: 'Grace',
        report_date: '2024-01-15',
        yesterday_results: 'Customer requirement gathering session held.',
        today_plans: 'Prepare specification document.',
        issues: 'Customer requesting emergency feature by end of week. Risk of scope creep affecting deliverables.',
      },
      {
        member_id: 'M008',
        member_name: 'Henry',
        report_date: '2024-01-15',
        yesterday_results: 'Database optimization tuning executed.',
        today_plans: 'Verify performance improvements.',
        issues: 'Query performance degradation observed after index changes. Problem with transaction lock contention.',
      },
      {
        member_id: 'M009',
        member_name: 'Iris',
        report_date: '2024-01-15',
        yesterday_results: 'Team communication protocol documented.',
        today_plans: 'Conduct team alignment meeting.',
        issues: 'Miscommunication between frontend and backend teams causing rework. Concern about API contract versioning.',
      },
      {
        member_id: 'M010',
        member_name: 'Jack',
        report_date: '2024-01-15',
        yesterday_results: 'Vendor contract negotiation completed.',
        today_plans: 'Finalize procurement order.',
        issues: 'Vendor delivery delayed by two weeks impacting timeline. Risk of project deadline slippage.',
      },
    ];

    const extraction_result = extractAndRankIssues(aggregated_daily_reports);

    // Verify extracted issue keywords count (expected: 5+ issues)
    expect(extraction_result.extracted_issues).toBeDefined();
    expect(Array.isArray(extraction_result.extracted_issues)).toBe(true);
    expect(extraction_result.extracted_issues.length).toBeGreaterThanOrEqual(5);

    // Verify each extracted issue contains explicit issue-related keywords
    extraction_result.extracted_issues.forEach((issue_item) => {
      expect(issue_item.keyword).toBeDefined();
      expect(typeof issue_item.keyword).toBe('string');
      expect(issue_item.keyword.length).toBeGreaterThan(0);
      const issue_keywords = [
        'timeout',
        'vulnerability',
        'conflict',
        'missing',
        'exceeded',
        'flaky',
        'emergency',
        'degradation',
        'miscommunication',
        'delayed',
      ];
      const keyword_lower = issue_item.keyword.toLowerCase();
      const has_issue_keyword = issue_keywords.some((kw) => keyword_lower.includes(kw));
      expect(has_issue_keyword).toBe(true);
    });

    // Verify each extracted issue is classified into predefined categories
    const valid_categories = ['system', 'process', 'resource', 'quality', 'safety', 'infrastructure', 'communication'];
    extraction_result.extracted_issues.forEach((issue_item) => {
      expect(issue_item.category).toBeDefined();
      expect(Array.isArray(issue_item.category) || typeof issue_item.category === 'string').toBe(true);
      if (Array.isArray(issue_item.category)) {
        expect(issue_item.category.length).toBeGreaterThan(0);
        issue_item.category.forEach((cat) => {
          expect(valid_categories).toContain(cat.toLowerCase());
        });
      } else {
        expect(valid_categories).toContain(issue_item.category.toLowerCase());
      }
    });

    // Verify priority determination includes three decision factors
    expect(extraction_result.priority_determinations).toBeDefined();
    expect(Array.isArray(extraction_result.priority_determinations)).toBe(true);
    expect(extraction_result.priority_determinations.length).toBeGreaterThanOrEqual(
      extraction_result.extracted_issues.length,
    );

    extraction_result.priority_determinations.forEach((determination) => {
      expect(determination.issue_id).toBeDefined();
      expect(determination.impact_scope).toBeDefined();
      expect(['organizational', 'multi_department', 'single_department']).toContain(determination.impact_scope);

      expect(determination.urgency).toBeDefined();
      expect(['immediate', 'this_week', 'next_week_or_later']).toContain(determination.urgency);

      expect(determination.recurrence_risk).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(determination.recurrence_risk);

      expect(determination.priority).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(determination.priority);

      expect(determination.rationale).toBeDefined();
      expect(typeof determination.rationale).toBe('string');
      expect(determination.rationale.length).toBeGreaterThan(0);
    });

    // Verify final ranked list structure with priority ordering
    expect(extraction_result.ranked_issue_list).toBeDefined();
    expect(Array.isArray(extraction_result.ranked_issue_list)).toBe(true);
    expect(extraction_result.ranked_issue_list.length).toBeGreaterThanOrEqual(5);

    const priority_order = ['high', 'medium', 'low'];
    let last_priority_index = -1;
    extraction_result.ranked_issue_list.forEach((ranked_issue) => {
      expect(ranked_issue.keyword).toBeDefined();
      expect(ranked_issue.category).toBeDefined();
      expect(ranked_issue.priority).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(ranked_issue.priority);

      const current_priority_index = priority_order.indexOf(ranked_issue.priority);
      expect(current_priority_index).toBeGreaterThanOrEqual(last_priority_index);
      last_priority_index = current_priority_index;

      expect(ranked_issue.impact_scope).toBeDefined();
      expect(ranked_issue.urgency).toBeDefined();
      expect(ranked_issue.recurrence_risk).toBeDefined();
    });

    // Verify email generation includes required components
    expect(extraction_result.email_instruction).toBeDefined();
    expect(extraction_result.email_instruction.recipient).toBe('director@company.com');
    expect(extraction_result.email_instruction.subject).toContain('Priority-Ranked Issue List');
    expect(extraction_result.email_instruction.body).toBeDefined();
    expect(extraction_result.email_instruction.body.length).toBeGreaterThan(0);

    // Verify email body contains high priority issues
    const high_priority_issues = extraction_result.ranked_issue_list.filter((issue) => issue.priority === 'high');
    expect(high_priority_issues.length).toBeGreaterThan(0);
    high_priority_issues.forEach((issue) => {
      expect(extraction_result.email_instruction.body).toContain(issue.keyword);
      expect(extraction_result.email_instruction.body).toContain('【Priority: High】');
    });

    // Verify all actions were executed in sequence
    expect(extraction_result.action_execution_log).toBeDefined();
    expect(Array.isArray(extraction_result.action_execution_log)).toBe(true);
    expect(extraction_result.action_execution_log.length).toBeGreaterThanOrEqual(5);

    const expected_actions = [
      'action-01_keyword_extraction',
      'action-02_category_classification',
      'action-03_priority_determination',
      'action-04_ranked_list_generation',
      'action-05_email_instruction',
    ];
    extraction_result.action_execution_log.forEach((log_entry, index) => {
      if (index < expected_actions.length) {
        expect(log_entry.action_name).toBe(expected_actions[index]);
        expect(log_entry.status).toBe('completed');
        expect(log_entry.timestamp).toBeDefined();
      }
    });

    // Verify email instruction count is exactly 1
    expect(extraction_result.email_instruction_count).toBe(1);

    // Verify result timestamp
    expect(extraction_result.generated_at).toBeDefined();
    expect(new Date(extraction_result.generated_at)).toBeInstanceOf(Date);
  });
});