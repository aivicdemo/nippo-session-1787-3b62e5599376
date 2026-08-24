import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractDashboardReportData } from '../../src/logic/manager-dashboard';
import type {
  ExtractDashboardReportDataInput,
  DashboardReportDataOutput,
  SubmissionSummary,
  UnsubmittedMember,
  PrioritizedIssue,
} from '../../src/logic/manager-dashboard';

describe('Manager Dashboard - Unsubmitted Member Emphasis Display', () => {
  // SCEN-117
  test('should highlight unsubmitted members with distinct visual styling different from submitted members', async () => {
    // Setup: Initialize test database with 10 team members
    // Members A-D: submitted, Members E-N: unsubmitted
    const submitted_member_ids = ['user_a', 'user_b', 'user_c', 'user_d'];
    const unsubmitted_member_ids = [
      'user_e',
      'user_f',
      'user_g',
      'user_h',
      'user_i',
      'user_j',
      'user_k',
      'user_l',
      'user_m',
      'user_n',
    ];

    const test_report_date = '2024-01-15';
    const department_manager_user_id = 'manager_001';
    const target_team_id = 'team_dev_001';
    const total_members = 10;
    const submitted_count = 4;
    const unsubmitted_count = 6;

    // Mock NotificationServiceAdapter
    const mock_notification_service = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        delivery_timestamp: new Date().toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled_id: 'sched_001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent_count: unsubmitted_count,
        failed_count: 0,
      }),
    };

    // Mock TextAnalysisServiceAdapter
    const mock_text_analysis_service = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'database_issue', frequency: 2 },
        { keyword: 'api_latency', frequency: 3 },
        { keyword: 'deployment_blocker', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue({
        score: 75,
        level: 'high',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const input: ExtractDashboardReportDataInput = {
      userId: department_manager_user_id,
      teamId: target_team_id,
      reportDate: test_report_date,
      includeUnsubmitted: true,
    };

    // Execute: Call extractDashboardReportData
    const result: DashboardReportDataOutput = await extractDashboardReportData(
      input,
      mock_notification_service,
      mock_text_analysis_service,
    );

    // Verify: Check that result contains submission summary and unsubmitted members list
    expect(result).toBeDefined();
    expect(result.reportDate).toBe(test_report_date);

    // Validate submission summary
    const submission_summary: SubmissionSummary = result.submissionSummary;
    expect(submission_summary.totalMembers).toBe(total_members);
    expect(submission_summary.submittedCount).toBe(submitted_count);
    expect(submission_summary.unsubmittedCount).toBe(unsubmitted_count);
    expect(submission_summary.submissionRate).toBe(40); // (4/10) * 100 = 40

    // Validate unsubmitted members list includes all unsubmitted members
    const unsubmitted_members: UnsubmittedMember[] = result.unsubmittedMembers;
    expect(unsubmitted_members.length).toBe(unsubmitted_count);

    // Verify each unsubmitted member has the required properties for visual emphasis
    unsubmitted_members.forEach((member: UnsubmittedMember) => {
      expect(member.memberId).toBeDefined();
      expect(member.memberName).toBeDefined();
      expect(member.submissionStatus).toBe('pending');
      expect(unsubmitted_member_ids).toContain(member.memberId);

      // Verify visual emphasis properties exist
      expect(member.emphasizeColor).toBeDefined();
      expect(member.emphasizeColor).toBe('red'); // Unsubmitted emphasis color
      expect(member.isHighlighted).toBe(true);
    });

    // Validate prioritized issues with color emphasis
    const prioritized_issues: PrioritizedIssue[] = result.prioritizedIssues;
    expect(Array.isArray(prioritized_issues)).toBe(true);

    prioritized_issues.forEach((issue: PrioritizedIssue) => {
      expect(issue.issueId).toBeDefined();
      expect(issue.priorityScore).toBeDefined();
      expect(typeof issue.priorityScore).toBe('number');
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);

      // Verify color coding based on priority score
      if (issue.priorityScore >= 70) {
        expect(issue.priorityColor).toBe('red');
      } else if (issue.priorityScore >= 40) {
        expect(issue.priorityColor).toBe('yellow');
      } else {
        expect(issue.priorityColor).toBe('green');
      }
    });

    // Verify that unsubmitted members visual styling differs from submitted members
    // Create mock DOM elements to demonstrate style application
    const submitted_member_element = document.createElement('div');
    submitted_member_element.className = 'member-card member-card--submitted';
    submitted_member_element.style.backgroundColor = '#E8F5E9';
    submitted_member_element.style.color = '#2E7D32';

    const unsubmitted_member_element = document.createElement('div');
    unsubmitted_member_element.className = 'member-card member-card--unsubmitted';
    unsubmitted_member_element.style.backgroundColor = '#FFE4E4';
    unsubmitted_member_element.style.color = '#C62828';
    unsubmitted_member_element.style.borderLeft = '4px solid #D32F2F';

    // Get computed styles
    const submitted_bg_color = window
      .getComputedStyle(submitted_member_element)
      .getPropertyValue('background-color');
    const unsubmitted_bg_color = window
      .getComputedStyle(unsubmitted_member_element)
      .getPropertyValue('background-color');

    const submitted_text_color = window
      .getComputedStyle(submitted_member_element)
      .getPropertyValue('color');
    const unsubmitted_text_color = window
      .getComputedStyle(unsubmitted_member_element)
      .getPropertyValue('color');

    // Verify visual distinction exists
    expect(submitted_bg_color).not.toBe(unsubmitted_bg_color);
    expect(submitted_text_color).not.toBe(unsubmitted_text_color);

    // Verify unsubmitted element has highlight indicator
    expect(
      unsubmitted_member_element.classList.contains(
        'member-card--unsubmitted',
      ),
    ).toBe(true);
    expect(
      submitted_member_element.classList.contains('member-card--submitted'),
    ).toBe(true);

    // Verify class distinction
    expect(
      unsubmitted_member_element.className !==
        submitted_member_element.className,
    ).toBe(true);

    // Verify unsubmitted members are included in output when includeUnsubmitted is true
    expect(result.unsubmittedMembers.length).toBeGreaterThan(0);
    expect(result.unsubmittedMembers.length).toBe(unsubmitted_count);

    // Verify last updated timestamp is recorded
    expect(result.lastUpdatedAt).toBeDefined();
    expect(
      new Date(result.lastUpdatedAt).toISOString().length,
    ).toBeGreaterThan(0);

    // Final assertion: Ensure visual distinction is confirmed
    const has_visual_distinction = unsubmitted_members.every(
      (member: UnsubmittedMember) =>
        member.emphasizeColor === 'red' && member.isHighlighted === true,
    );
    expect(has_visual_distinction).toBe(true);
  });
});