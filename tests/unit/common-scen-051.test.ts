import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('Tx2Imp1Agent - Low Confidence AI Output Handling', () => {
  // SCEN-051
  test('should escalate and send manual review email when Action 3 returns low-confidence or malformed issue extraction', async () => {
    const executionTimestamp = new Date('2024-01-15T08:55:00Z');
    const teamId = 'team-001';
    const reportingDeadline = new Date('2024-01-15T09:00:00Z');
    const managerEmail = 'manager@example.com';

    const normalizedDailyReports = [
      {
        memberId: 'member-001',
        memberName: 'John Doe',
        reportDate: '2024-01-15',
        reportContent: 'Completed API development. Encountered database performance issue during load test.',
        submittedAt: new Date('2024-01-15T08:30:00Z'),
      },
      {
        memberId: 'member-002',
        memberName: 'Jane Smith',
        reportContent: 'Fixed authentication bug. QA testing passed.',
        submittedAt: new Date('2024-01-15T08:25:00Z'),
      },
    ];

    const mockAiClient = {
      action01_aggregateReports: async () => ({
        aggregatedStatus: 'completed',
        totalReportsCount: 2,
        unsubmittedMembersCount: 0,
      }),
      action02_normalizeFormat: async () => ({
        normalizationStatus: 'success',
        normalizedReportsCount: 2,
        formatValidationErrors: [],
      }),
      action03_extractAndClassifyIssues: async () => ({
        issues: [
          {
            issueId: 'issue-001',
            description: 'Database performance',
            priority: 'medium level',
            confidenceScore: 0.25,
            category: undefined,
          },
        ],
        extractionStatus: 'completed',
        totalExtractedCount: 1,
      }),
      action04_assignPriority: async () => ({
        prioritizedIssues: [],
        priorityAssignmentStatus: 'skipped',
      }),
      action05_identifyUnsubmitted: async () => ({
        unsubmittedMembers: [],
        unsubmittedCount: 0,
      }),
      action06_sendConfirmationEmail: async () => ({
        emailStatus: 'skipped',
        reason: 'manual_review_required',
      }),
    };

    const result = await runTx2Imp1Agent(
      {
        executionTimestamp,
        teamId,
        reportingDeadline,
        managerEmail,
      },
      mockAiClient as any
    );

    expect(result.aggregationStatus).toBe('completed');
    expect(result.extractedIssuesCount).toBe(0);
    expect(result.prioritizedIssuesList).toEqual([]);
    expect(result.emailSendStatus).toBe('escalated');

    expect(result).toHaveProperty('escalation_reason');
    expect(result.escalation_reason).toBe('low_confidence_ai_output');

    expect(result).toHaveProperty('affected_action');
    expect(result.affected_action).toBe(3);

    expect(result).toHaveProperty('human_review_required');
    expect(result.human_review_required).toBe(true);

    expect(result).toHaveProperty('fallback_email_sent_to_director');
    expect(result.fallback_email_sent_to_director).toBe(true);

    expect(result).toHaveProperty('escalation_log');
    expect(Array.isArray(result.escalation_log)).toBe(true);
    expect(result.escalation_log.length).toBeGreaterThan(0);

    const validationFailureLog = result.escalation_log.find(
      (log: any) => log.event === 'Action 3 validation failed'
    );
    expect(validationFailureLog).toBeDefined();
    expect(validationFailureLog.reason).toMatch(/confidence score/i);
    expect(validationFailureLog.affected_issues).toBeDefined();

    expect(result).toHaveProperty('manual_review_email_content');
    expect(result.manual_review_email_content).toContain('AI出力の信頼度が不足しています');
    expect(result.manual_review_email_content).toContain('John Doe');
    expect(result.manual_review_email_content).toContain('手動で再判定');
  });
});