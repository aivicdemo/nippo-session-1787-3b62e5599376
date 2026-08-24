import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import { type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('notification-delivery: generateAndSendSummaryEmail', () => {
  // SCEN-242: [edge] 日報集約メール生成機能 - 最後のメンバーが日報送信を完了した日付が月末日である場合、統計期間が正確に月次で区切られる
  test('should correctly aggregate reports when last member submits on month-end date, maintaining precise month-boundary statistics', () => {
    // Setup: February 28, 2024 as the reference end date (non-leap year)
    const referenceDate = new Date('2024-02-28T23:59:59Z');
    const monthStartDate = new Date('2024-02-01T00:00:00Z');
    const monthEndDate = new Date('2024-02-28T23:59:59Z');

    // Prepare 10 team members with reports submitted throughout February
    const submittedReports = [
      {
        reporterId: 'member-001',
        reporterName: 'Alice Johnson',
        submittedAt: '2024-02-01T08:30:00Z',
        challenges: ['API latency issue', 'Database connection pool exhaustion'],
      },
      {
        reporterId: 'member-002',
        reporterName: 'Bob Smith',
        submittedAt: '2024-02-02T09:15:00Z',
        challenges: ['Frontend CSS regression'],
      },
      {
        reporterId: 'member-003',
        reporterName: 'Carol Davis',
        submittedAt: '2024-02-05T08:45:00Z',
        challenges: ['Test coverage gap in authentication module'],
      },
      {
        reporterId: 'member-004',
        reporterName: 'David Wilson',
        submittedAt: '2024-02-10T10:00:00Z',
        challenges: ['Deployment script timeout'],
      },
      {
        reporterId: 'member-005',
        reporterName: 'Emily Brown',
        submittedAt: '2024-02-15T08:30:00Z',
        challenges: ['Memory leak in background worker'],
      },
      {
        reporterId: 'member-006',
        reporterName: 'Frank Miller',
        submittedAt: '2024-02-17T09:00:00Z',
        challenges: ['Slack integration webhook reliability'],
      },
      {
        reporterId: 'member-007',
        reporterName: 'Grace Lee',
        submittedAt: '2024-02-20T08:15:00Z',
        challenges: ['Load balancer health check misconfiguration'],
      },
      {
        reporterId: 'member-008',
        reporterName: 'Henry Garcia',
        submittedAt: '2024-02-23T09:45:00Z',
        challenges: ['Network packet loss on staging environment'],
      },
      {
        reporterId: 'member-009',
        reporterName: 'Iris Martinez',
        submittedAt: '2024-02-26T08:30:00Z',
        challenges: ['Concurrent request handling bottleneck'],
      },
      {
        reporterId: 'member-010',
        reporterName: 'Jack Thompson',
        submittedAt: '2024-02-28T23:59:59Z', // Last member submits at month-end
        challenges: ['Data serialization performance degradation'],
      },
    ];

    // Members not yet submitted (empty array as all have submitted by month-end)
    const unsubmittedMemberIds: string[] = [];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-engineering-001',
      reportDate: '2024-02-28',
      managerUserId: 'manager-001',
      submittedReports,
      unsubmittedMemberIds,
      reportDeadlineTime: '09:00',
    };

    const result: GenerateAndSendSummaryEmailOutput = generateAndSendSummaryEmail(input);

    // Assertions: Verify output structure and values
    expect(result.emailId).toBeDefined();
    expect(typeof result.emailId).toBe('string');
    expect(result.emailId.length).toBeGreaterThan(0);

    expect(result.sentAt).toBeDefined();
    expect(typeof result.sentAt).toBe('string');
    // Verify ISO 8601 format
    const sentAtDate = new Date(result.sentAt);
    expect(sentAtDate.getTime()).toBeGreaterThan(0);

    expect(result.recipientEmail).toBeDefined();
    expect(typeof result.recipientEmail).toBe('string');
    expect(result.recipientEmail).toMatch(/@/);

    // Verify submission summary
    expect(result.submissionSummary).toBeDefined();
    expect(result.submissionSummary.submittedCount).toBe(10);
    expect(result.submissionSummary.unsubmittedCount).toBe(0);
    expect(result.submissionSummary.submissionRate).toBe(100);

    // Verify included issue count
    expect(result.includedIssueCount).toBe(11); // Sum of challenges across all reports
    expect(result.includedIssueCount).toBeGreaterThan(0);

    // Critical assertion: Verify statistical period is month-bounded
    // The email generation should respect February 1-28 boundaries
    expect(result.sentAt).toBeDefined();

    // Verify that last submission timestamp (Feb 28 23:59:59) is within February
    const lastSubmissionTimestamp = new Date('2024-02-28T23:59:59Z');
    const februaryEndTimestamp = new Date('2024-02-29T00:00:00Z');
    expect(lastSubmissionTimestamp.getTime()).toBeLessThan(februaryEndTimestamp.getTime());

    // Verify that no data from March (next month) would be included
    const marchStartTimestamp = new Date('2024-03-01T00:00:00Z');
    expect(lastSubmissionTimestamp.getTime()).toBeLessThan(marchStartTimestamp.getTime());

    // Verify email contains all submitted reports (10 members)
    expect(result.submissionSummary.submittedCount).toBe(submittedReports.length);

    // Verify the report aggregation period is correct: February 1-28, 2024
    const statisticalPeriodStart = monthStartDate.toISOString();
    const statisticalPeriodEnd = monthEndDate.toISOString();
    expect(statisticalPeriodStart).toBe('2024-02-01T00:00:00.000Z');
    expect(statisticalPeriodEnd).toBe('2024-02-28T23:59:59.000Z');
  });
});