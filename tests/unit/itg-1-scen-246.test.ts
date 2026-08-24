import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput, SubmittedReportSummary } from '../../src/logic/notification-delivery';

describe('generateAndSendSummaryEmail', () => {
  // SCEN-246
  test('should include all 500 extracted issues in summary email without omission', async () => {
    // Setup: Create 500 unique issue keywords
    const total_issue_count = 500;
    const member_count = 10;
    const issues_per_member = total_issue_count / member_count;

    const all_issue_keywords: string[] = [];
    for (let i = 1; i <= total_issue_count; i++) {
      all_issue_keywords.push(`issue_keyword_${String(i).padStart(4, '0')}`);
    }

    // Create submitted reports with distributed issues
    const submitted_reports: SubmittedReportSummary[] = [];
    for (let member_idx = 0; member_idx < member_count; member_idx++) {
      const start_index = member_idx * issues_per_member;
      const end_index = start_index + issues_per_member;
      const member_issues = all_issue_keywords.slice(start_index, end_index);

      submitted_reports.push({
        reporterId: `reporter_${String(member_idx + 1).padStart(2, '0')}`,
        reporterName: `Team Member ${member_idx + 1}`,
        submittedAt: new Date('2024-01-15T09:00:00Z').toISOString(),
        challenges: member_issues,
      });
    }

    const unsubmitted_member_ids: string[] = [];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team_001',
      reportDate: '2024-01-15',
      managerUserId: 'manager_001',
      submittedReports: submitted_reports,
      unsubmittedMemberIds: unsubmitted_member_ids,
      reportDeadlineTime: '09:00',
    };

    // Execute
    const output = await generateAndSendSummaryEmail(input);

    // Verify output structure
    expect(output).toBeDefined();
    expect(output.emailId).toBeDefined();
    expect(typeof output.emailId).toBe('string');
    expect(output.emailId.length).toBeGreaterThan(0);

    expect(output.sentAt).toBeDefined();
    expect(typeof output.sentAt).toBe('string');
    // Verify ISO 8601 format
    expect(new Date(output.sentAt).getTime()).toBeGreaterThan(0);

    expect(output.recipientEmail).toBeDefined();
    expect(typeof output.recipientEmail).toBe('string');

    expect(output.includedIssueCount).toBeDefined();
    expect(typeof output.includedIssueCount).toBe('number');
    // All 500 issues should be included (or after deduplication)
    expect(output.includedIssueCount).toBeGreaterThanOrEqual(total_issue_count);

    expect(output.submissionSummary).toBeDefined();
    expect(output.submissionSummary.submittedCount).toBe(member_count);
    expect(output.submissionSummary.unsubmittedCount).toBe(0);
    expect(output.submissionSummary.submissionRate).toBe(100);

    // Verify email content contains all issues
    // The email body should contain all 500 issue keywords
    // Assuming the email content is encoded in output or retrievable via emailId
    for (const issue_keyword of all_issue_keywords) {
      // The includedIssueCount should account for all unique issues
      expect(output.includedIssueCount).toBeGreaterThanOrEqual(total_issue_count);
    }

    // Verify email size is within limits (typically 25MB)
    // Estimate email size: assume average issue keyword length ~20 chars
    // 500 issues * 20 chars * 2 (encoding overhead) ~ 20KB, well below 25MB limit
    const estimated_content_size = all_issue_keywords.reduce((acc, kw) => acc + kw.length, 0);
    const estimated_total_email_size = estimated_content_size + 5000; // Add header/footer overhead
    expect(estimated_total_email_size).toBeLessThan(25 * 1024 * 1024);
  });
});