import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssues } from '../../src/logic/issue-extraction-prioritization';
import type { Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/types';

describe('Issue Extraction and Prioritization', () => {
  // SCEN-061: [normal] 日報集約から優先度別課題一覧提示までの自動判定・配信 AIエージェント
  test('should extract and rank issues from aggregated daily reports with priority classification', () => {
    // Setup: Test aggregated daily report data (5 reports with multiple issue keywords)
    const aggregatedReports = [
      {
        reportId: 'report-001',
        submitterId: 'member-001',
        date: '2024-01-15',
        content: 'Database query performance issue affecting multiple departments. Customer impact observed.',
        issues: [
          { keyword: 'performance', severity: 'high' },
          { keyword: 'database', severity: 'high' },
        ],
      },
      {
        reportId: 'report-002',
        submitterId: 'member-002',
        date: '2024-01-15',
        content: 'Minor UI bug in user profile page. Only affects individual users.',
        issues: [
          { keyword: 'ui_bug', severity: 'low' },
        ],
      },
      {
        reportId: 'report-003',
        submitterId: 'member-003',
        date: '2024-01-15',
        content: 'API integration failure with third-party payment service. Team productivity impacted.',
        issues: [
          { keyword: 'api_failure', severity: 'medium' },
          { keyword: 'third_party', severity: 'medium' },
        ],
      },
      {
        reportId: 'report-004',
        submitterId: 'member-004',
        date: '2024-01-15',
        content: 'Recurring issue with build pipeline timeout. This is the third time this month.',
        issues: [
          { keyword: 'build_timeout', severity: 'medium' },
        ],
      },
      {
        reportId: 'report-005',
        submitterId: 'member-005',
        date: '2024-01-15',
        content: 'Security vulnerability discovered in authentication module. Critical and recurring.',
        issues: [
          { keyword: 'security', severity: 'high' },
          { keyword: 'authentication', severity: 'high' },
        ],
      },
    ];

    // Priority determination rules reference table
    const priorityRules = [
      {
        ruleId: 'rule-001',
        scope: 'organization',
        urgency: 'high',
        recurrenceRisk: true,
        priorityLevel: 'High',
      },
      {
        ruleId: 'rule-002',
        scope: 'department',
        urgency: 'medium',
        recurrenceRisk: true,
        priorityLevel: 'High',
      },
      {
        ruleId: 'rule-003',
        scope: 'department',
        urgency: 'medium',
        recurrenceRisk: false,
        priorityLevel: 'Medium',
      },
      {
        ruleId: 'rule-004',
        scope: 'individual',
        urgency: 'low',
        recurrenceRisk: false,
        priorityLevel: 'Low',
      },
    ];

    // Mock AI client implementing Tx3Imp1AiClient interface
    const mockAiClient: Tx3Imp1AiClient = {
      action01_extractIssueKeywords: jest.fn().mockResolvedValue({
        extracted_issues: [
          { id: 'issue-001', keyword: 'performance', source_report: 'report-001', category: 'performance' },
          { id: 'issue-002', keyword: 'database', source_report: 'report-001', category: 'infrastructure' },
          { id: 'issue-003', keyword: 'ui_bug', source_report: 'report-002', category: 'frontend' },
          { id: 'issue-004', keyword: 'api_failure', source_report: 'report-003', category: 'integration' },
          { id: 'issue-005', keyword: 'third_party', source_report: 'report-003', category: 'integration' },
          { id: 'issue-006', keyword: 'build_timeout', source_report: 'report-004', category: 'devops' },
          { id: 'issue-007', keyword: 'security', source_report: 'report-005', category: 'security' },
          { id: 'issue-008', keyword: 'authentication', source_report: 'report-005', category: 'security' },
        ],
      }),
      action02_classifyIssues: jest.fn().mockResolvedValue({
        classified_issues: [
          {
            id: 'issue-001',
            category: 'performance',
            scope: 'organization',
            urgency: 'high',
            recurrence_risk: true,
          },
          {
            id: 'issue-002',
            category: 'infrastructure',
            scope: 'organization',
            urgency: 'high',
            recurrence_risk: false,
          },
          {
            id: 'issue-003',
            category: 'frontend',
            scope: 'individual',
            urgency: 'low',
            recurrence_risk: false,
          },
          {
            id: 'issue-004',
            category: 'integration',
            scope: 'department',
            urgency: 'medium',
            recurrence_risk: false,
          },
          {
            id: 'issue-005',
            category: 'integration',
            scope: 'department',
            urgency: 'medium',
            recurrence_risk: false,
          },
          {
            id: 'issue-006',
            category: 'devops',
            scope: 'department',
            urgency: 'medium',
            recurrence_risk: true,
          },
          {
            id: 'issue-007',
            category: 'security',
            scope: 'organization',
            urgency: 'high',
            recurrence_risk: true,
          },
          {
            id: 'issue-008',
            category: 'security',
            scope: 'organization',
            urgency: 'high',
            recurrence_risk: true,
          },
        ],
      }),
      action03_evaluatePriority: jest.fn().mockResolvedValue({
        prioritized_issues: [
          {
            id: 'issue-001',
            scope: 'organization',
            urgency: 'high',
            recurrence_risk: true,
            matched_rule_id: 'rule-001',
            priority_level: 'High',
          },
          {
            id: 'issue-002',
            scope: 'organization',
            urgency: 'high',
            recurrence_risk: false,
            matched_rule_id: 'rule-001',
            priority_level: 'High',
          },
          {
            id: 'issue-007',
            scope: 'organization',
            urgency: 'high',
            recurrence_risk: true,
            matched_rule_id: 'rule-001',
            priority_level: 'High',
          },
          {
            id: 'issue-008',
            scope: 'organization',
            urgency: 'high',
            recurrence_risk: true,
            matched_rule_id: 'rule-001',
            priority_level: 'High',
          },
          {
            id: 'issue-006',
            scope: 'department',
            urgency: 'medium',
            recurrence_risk: true,
            matched_rule_id: 'rule-002',
            priority_level: 'High',
          },
          {
            id: 'issue-004',
            scope: 'department',
            urgency: 'medium',
            recurrence_risk: false,
            matched_rule_id: 'rule-003',
            priority_level: 'Medium',
          },
          {
            id: 'issue-005',
            scope: 'department',
            urgency: 'medium',
            recurrence_risk: false,
            matched_rule_id: 'rule-003',
            priority_level: 'Medium',
          },
          {
            id: 'issue-003',
            scope: 'individual',
            urgency: 'low',
            recurrence_risk: false,
            matched_rule_id: 'rule-004',
            priority_level: 'Low',
          },
        ],
      }),
      action04_generateRankedList: jest.fn().mockResolvedValue({
        ranked_issues: [
          {
            rank: 1,
            issue_id: 'issue-001',
            title: 'Database query performance issue',
            summary: 'Performance degradation affecting multiple departments with customer impact',
            category: 'performance',
            priority_level: 'High',
            scope: 'organization',
            urgency: 'high',
            recurrence_risk: true,
            matched_rule_id: 'rule-001',
            source_report_id: 'report-001',
          },
          {
            rank: 2,
            issue_id: 'issue-002',
            title: 'Database infrastructure issue',
            summary: 'Database infrastructure problem with organization-wide impact',
            category: 'infrastructure',
            priority_level: 'High',
            scope: 'organization',
            urgency: 'high',
            recurrence_risk: false,
            matched_rule_id: 'rule-001',
            source_report_id: 'report-001',
          },
          {
            rank: 3,
            issue_id: 'issue-007',
            title: 'Security vulnerability in authentication',
            summary: 'Critical security vulnerability in authentication module',
            category: 'security',
            priority_level: 'High',
            scope: 'organization',
            urgency: 'high',
            recurrence_risk: true,
            matched_rule_id: 'rule-001',
            source_report_id: 'report-005',
          },
          {
            rank: 4,
            issue_id: 'issue-008',
            title: 'Authentication module security issue',
            summary: 'Recurring critical security issue in authentication',
            category: 'security',
            priority_level: 'High',
            scope: 'organization',
            urgency: 'high',
            recurrence_risk: true,
            matched_rule_id: 'rule-001',
            source_report_id: 'report-005',
          },
          {
            rank: 5,
            issue_id: 'issue-006',
            title: 'Build pipeline recurring timeout',
            summary: 'Third occurrence of build pipeline timeout this month',
            category: 'devops',
            priority_level: 'High',
            scope: 'department',
            urgency: 'medium',
            recurrence_risk: true,
            matched_rule_id: 'rule-002',
            source_report_id: 'report-004',
          },
          {
            rank: 6,
            issue_id: 'issue-004',
            title: 'API integration failure with payment service',
            summary: 'Third-party payment service integration failure affecting team productivity',
            category: 'integration',
            priority_level: 'Medium',
            scope: 'department',
            urgency: 'medium',
            recurrence_risk: false,
            matched_rule_id: 'rule-003',
            source_report_id: 'report-003',
          },
          {
            rank: 7,
            issue_id: 'issue-005',
            title: 'Third-party integration issue',
            summary: 'Integration issue with external service',
            category: 'integration',
            priority_level: 'Medium',
            scope: 'department',
            urgency: 'medium',
            recurrence_risk: false,
            matched_rule_id: 'rule-003',
            source_report_id: 'report-003',
          },
          {
            rank: 8,
            issue_id: 'issue-003',
            title: 'Minor UI bug in user profile',
            summary: 'UI bug affecting individual user profile page only',
            category: 'frontend',
            priority_level: 'Low',
            scope: 'individual',
            urgency: 'low',
            recurrence_risk: false,
            matched_rule_id: 'rule-004',
            source_report_id: 'report-002',
          },
        ],
      }),
    };

    // Execute extractAndRankIssues
    const result = extractAndRankIssues(aggregatedReports, mockAiClient);

    // Verify result structure and properties
    expect(result).toBeDefined();
    expect(Array.isArray(result.ranked_issues)).toBe(true);
    expect(result.ranked_issues.length).toBe(8);

    // Verify priority-level classification: High > Medium > Low
    const highPriorityIssues = result.ranked_issues.filter((issue: any) => issue.priority_level === 'High');
    const mediumPriorityIssues = result.ranked_issues.filter((issue: any) => issue.priority_level === 'Medium');
    const lowPriorityIssues = result.ranked_issues.filter((issue: any) => issue.priority_level === 'Low');

    expect(highPriorityIssues.length).toBe(5);
    expect(mediumPriorityIssues.length).toBe(2);
    expect(lowPriorityIssues.length).toBe(1);

    // Verify priority order: High issues come before Medium, Medium before Low
    for (let i = 0; i < result.ranked_issues.length - 1; i++) {
      const current = result.ranked_issues[i];
      const next = result.ranked_issues[i + 1];
      const priorityOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
      expect(priorityOrder[current.priority_level]).toBeGreaterThanOrEqual(priorityOrder[next.priority_level]);
    }

    // Verify no duplicate issue IDs
    const issueIds = result.ranked_issues.map((issue: any) => issue.issue_id);
    const uniqueIssueIds = new Set(issueIds);
    expect(issueIds.length).toBe(uniqueIssueIds.size);

    // Verify each issue has required fields
    result.ranked_issues.forEach((issue: any) => {
      expect(issue.issue_id).toBeDefined();
      expect(issue.title).toBeDefined();
      expect(issue.summary).toBeDefined();
      expect(issue.category).toBeDefined();
      expect(issue.priority_level).toMatch(/High|Medium|Low/);
      expect(issue.scope).toMatch(/organization|department|individual/);
      expect(issue.urgency).toMatch(/high|medium|low/);
      expect(typeof issue.recurrence_risk).toBe('boolean');
      expect(issue.matched_rule_id).toBeDefined();
      expect(issue.source_report_id).toBeDefined();
      expect(issue.rank).toBeGreaterThan(0);
    });

    // Verify matched rule IDs align with expected rules
    result.ranked_issues.forEach((issue: any) => {
      expect(['rule-001', 'rule-002', 'rule-003', 'rule-004']).toContain(issue.matched_rule_id);
    });

    // Verify all extracted issues from 5 reports are included (no data loss)
    const expectedIssueCount = 8; // Total issues across 5 reports
    expect(result.ranked_issues.length).toBe(expectedIssueCount);

    // Verify source report IDs match input reports
    const sourceReportIds = new Set(result.ranked_issues.map((issue: any) => issue.source_report_id));
    const inputReportIds = new Set(aggregatedReports.map((report) => report.reportId));
    expect(Array.from(sourceReportIds).every((id) => inputReportIds.has(id))).toBe(true);

    // Verify ranking is sequential starting from 1
    result.ranked_issues.forEach((issue: any, index: number) => {
      expect(issue.rank).toBe(index + 1);
    });

    // Verify High priority issues include security and performance keywords
    const highPriorityIssueIds = highPriorityIssues.map((issue: any) => issue.issue_id);
    expect(highPriorityIssueIds).toContain('issue-001'); // performance
    expect(highPriorityIssueIds).toContain('issue-007'); // security
    expect(highPriorityIssueIds).toContain('issue-008'); // authentication
  });
});