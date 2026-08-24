import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import { type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('部長向けダッシュボードに本日の報告提出状況をリアルタイム表示', () => {
  // SCEN-206: [normal] 未提出者リスト生成機能 - 複数の未提出メンバーが存在する場合、全員が未提出者リストに含まれる
  test('should include all unsubmitted members in the summary email with correct count and details', () => {
    const reportDate = '2024-01-15';
    const reportDeadlineTime = '09:00';
    const teamId = 'team-001';
    const managerUserId = 'manager-001';

    const submittedReports = [
      {
        reporterId: 'user-001',
        reporterName: 'Alice Johnson',
        submittedAt: '2024-01-15T08:45:00Z',
        challenges: ['Database performance issue', 'API timeout'],
      },
      {
        reporterId: 'user-002',
        reporterName: 'Bob Smith',
        submittedAt: '2024-01-15T08:50:00Z',
        challenges: ['Testing environment setup'],
      },
      {
        reporterId: 'user-003',
        reporterName: 'Carol Williams',
        submittedAt: '2024-01-15T08:30:00Z',
        challenges: [],
      },
      {
        reporterId: 'user-004',
        reporterName: 'David Brown',
        submittedAt: '2024-01-15T08:55:00Z',
        challenges: ['Deployment delay', 'Code review backlog'],
      },
      {
        reporterId: 'user-005',
        reporterName: 'Eve Davis',
        submittedAt: '2024-01-15T08:35:00Z',
        challenges: ['Memory leak detection'],
      },
    ];

    const unsubmittedMemberIds = [
      'user-006',
      'user-007',
      'user-008',
      'user-009',
      'user-010',
    ];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId,
      reportDate,
      managerUserId,
      submittedReports,
      unsubmittedMemberIds,
      reportDeadlineTime,
    };

    const result: GenerateAndSendSummaryEmailOutput = generateAndSendSummaryEmail(input);

    expect(result.emailId).toBeDefined();
    expect(typeof result.emailId).toBe('string');
    expect(result.emailId.length).toBeGreaterThan(0);

    expect(result.sentAt).toBeDefined();
    expect(typeof result.sentAt).toBe('string');

    expect(result.recipientEmail).toBeDefined();
    expect(typeof result.recipientEmail).toBe('string');

    expect(result.includedIssueCount).toBe(6);

    expect(result.submissionSummary).toBeDefined();
    expect(result.submissionSummary.submittedCount).toBe(5);
    expect(result.submissionSummary.unsubmittedCount).toBe(5);
    expect(result.submissionSummary.submissionRate).toBe(50);
  });
});