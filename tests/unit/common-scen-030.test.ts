import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-030: [error] 日報集約から課題優先順位付けと未提出通知までの自律実行 AIエージェント - 「日報集約から課題優先順位付けと未提出通知までの自律実行」が「同一課題が複数件報告された場合の統合判断」の場合に副作用の確定前に人へ引き継ぐ
  test('should escalate to human review when identical issues are reported by multiple employees', async () => {
    const mockReportData = [
      {
        employeeId: 'emp_001',
        employeeName: 'Employee A',
        reportDate: '2024-01-15',
        submittedAt: new Date('2024-01-15T08:00:00Z'),
        issues: [
          {
            issueId: 'issue_001',
            title: 'Database Connection Timeout',
            description: 'Connection to database times out during peak hours',
            severity: 'high',
            reportedAt: new Date('2024-01-15T08:00:00Z'),
          },
        ],
      },
      {
        employeeId: 'emp_002',
        employeeName: 'Employee B',
        reportDate: '2024-01-15',
        submittedAt: new Date('2024-01-15T08:15:00Z'),
        issues: [
          {
            issueId: 'issue_002',
            title: 'Database Connection Timeout',
            description: 'DB timeout observed in production environment',
            severity: 'high',
            reportedAt: new Date('2024-01-15T08:15:00Z'),
          },
        ],
      },
      {
        employeeId: 'emp_003',
        employeeName: 'Employee C',
        reportDate: '2024-01-15',
        submittedAt: new Date('2024-01-15T08:30:00Z'),
        issues: [
          {
            issueId: 'issue_003',
            title: 'Database Connection Timeout',
            description: 'Multiple timeout failures recorded',
            severity: 'high',
            reportedAt: new Date('2024-01-15T08:30:00Z'),
          },
        ],
      },
    ];

    const mockEmailSender = jest.fn().mockResolvedValue({
      success: true,
      messageId: 'msg_escalation_001',
    });

    const mockAuditLogger = jest.fn().mockResolvedValue({
      eventId: 'audit_001',
      recorded: true,
    });

    const result = await sendUnsubmittedReminder(
      mockReportData,
      mockEmailSender,
      mockAuditLogger,
      'manager_001'
    );

    expect(result).toEqual({
      status: 'ESCALATED_AWAITING_HUMAN_REVIEW',
      escalationType: 'DUPLICATE_ISSUE_CONSOLIDATION',
      pendingReviewIssues: [
        {
          issueTitle: 'Database Connection Timeout',
          reportedByEmployees: ['Employee A', 'Employee B', 'Employee C'],
          issueIds: ['issue_001', 'issue_002', 'issue_003'],
        },
      ],
      humanNotificationSent: true,
    });

    expect(mockEmailSender).toHaveBeenCalledTimes(1);
    const emailCall = mockEmailSender.mock.calls[0][0];
    expect(emailCall.recipient).toBe('manager_001');
    expect(emailCall.subject).toMatch(/エスカレーション/);
    expect(emailCall.body).toMatch(/Database Connection Timeout/);
    expect(emailCall.body).toMatch(/Employee A/);
    expect(emailCall.body).toMatch(/Employee B/);
    expect(emailCall.body).toMatch(/Employee C/);

    expect(mockAuditLogger).toHaveBeenCalledTimes(1);
    const auditCall = mockAuditLogger.mock.calls[0][0];
    expect(auditCall.escalationReason).toBe('DUPLICATE_ISSUE_CONSOLIDATION');
    expect(auditCall.status).toBe('Pending Human Review');
    expect(auditCall.targetIssueIds).toEqual(['issue_001', 'issue_002', 'issue_003']);
    expect(auditCall.timestamp).toBeDefined();
  });
});