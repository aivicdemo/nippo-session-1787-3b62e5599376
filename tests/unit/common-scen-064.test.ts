import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-064: Escalation when multi-department issue detected before action confirmation
  test('should escalate to human review when multi-department issue is detected and prevent auto-actions until approval', async () => {
    const mockAiClient = {
      extractIssueKeywords: jest.fn().mockResolvedValue({
        keywords: ['営業部', '製造部', '納期遅延'],
        departmentFlags: ['sales', 'manufacturing'],
      }),
      classifyIssueCategory: jest.fn().mockResolvedValue({
        category: 'multi_department_issue',
        classifications: [
          { keyword: '営業部', category: 'sales' },
          { keyword: '製造部', category: 'manufacturing' },
          { keyword: '納期遅延', category: 'deadline' },
        ],
        multiDepartmentDetected: true,
      }),
      assignPriority: jest.fn().mockResolvedValue({
        priority: 'high',
        score: 85,
      }),
      generateIssueSummary: jest.fn().mockResolvedValue({
        summary: 'Multi-department deadline issue',
      }),
      sendNotificationEmail: jest.fn().mockResolvedValue({
        emailSent: true,
        recipientId: 'manager_001',
      }),
      escalateToHuman: jest.fn().mockResolvedValue({
        escalationId: 'esc_20240115_001',
        status: 'escalation_pending',
        assignedTo: 'manager_001',
      }),
    };

    const aggregatedReportData = {
      reportDate: '2024-01-15',
      submittedReports: [
        {
          reportId: 'rep_001',
          employeeId: 'emp_sales_001',
          department: 'sales',
          issues: [
            {
              issueId: 'iss_001',
              title: '営業部と製造部に影響する納期遅延',
              description: '営業部の受注が製造部の生産スケジュールに遅延をもたらしている',
              affectedDepartments: ['sales', 'manufacturing'],
              timestamp: '2024-01-15T09:30:00Z',
            },
          ],
        },
      ],
      unsubmittedEmployees: [],
      aggregationTimestamp: '2024-01-15T10:00:00Z',
    };

    const action1Output = await mockAiClient.extractIssueKeywords(aggregatedReportData);
    expect(action1Output.departmentFlags).toEqual(['sales', 'manufacturing']);
    expect(action1Output.departmentFlags.length).toBe(2);

    const action2Output = await mockAiClient.classifyIssueCategory(action1Output);
    expect(action2Output.multiDepartmentDetected).toBe(true);
    expect(action2Output.category).toBe('multi_department_issue');
    expect(action2Output.classifications.length).toBeGreaterThanOrEqual(2);

    if (action2Output.multiDepartmentDetected) {
      const escalationResult = await mockAiClient.escalateToHuman(action2Output);
      expect(escalationResult.status).toBe('escalation_pending');
      expect(escalationResult.assignedTo).toBe('manager_001');
      expect(escalationResult.escalationId).toBeTruthy();

      expect(mockAiClient.assignPriority).not.toHaveBeenCalled();
      expect(mockAiClient.generateIssueSummary).not.toHaveBeenCalled();
      expect(mockAiClient.sendNotificationEmail).not.toHaveBeenCalled();

      const unsubmittedDetectionResult = await detectAndNotifyUnsubmitted(aggregatedReportData);
      expect(unsubmittedDetectionResult.status).toBe('escalation_pending');
      expect(unsubmittedDetectionResult.escalationId).toBe('esc_20240115_001');
      expect(unsubmittedDetectionResult.pendingApprovalBy).toBe('manager_001');
      expect(unsubmittedDetectionResult.auditLog).toContain(
        'multi_department_issue_detected'
      );
      expect(unsubmittedDetectionResult.auditLog).toContain(
        'auto_judgment_skipped'
      );
      expect(unsubmittedDetectionResult.auditLog).toContain(
        'human_handoff_initiated'
      );

      const managerApprovalSimulation = {
        escalationId: 'esc_20240115_001',
        approvalStatus: 'approved',
        approverEmployeeId: 'manager_001',
        approvalTimestamp: '2024-01-15T10:15:00Z',
      };

      mockAiClient.assignPriority.mockClear();
      mockAiClient.generateIssueSummary.mockClear();
      mockAiClient.sendNotificationEmail.mockClear();

      const action3OutputAfterApproval = await mockAiClient.assignPriority(
        action2Output
      );
      expect(action3OutputAfterApproval.priority).toBe('high');
      expect(action3OutputAfterApproval.score).toBe(85);

      const action4OutputAfterApproval = await mockAiClient.generateIssueSummary(
        action3OutputAfterApproval
      );
      expect(action4OutputAfterApproval.summary).toBeTruthy();

      const action5OutputAfterApproval = await mockAiClient.sendNotificationEmail(
        action4OutputAfterApproval
      );
      expect(action5OutputAfterApproval.emailSent).toBe(true);
      expect(action5OutputAfterApproval.recipientId).toBe('manager_001');

      expect(mockAiClient.assignPriority).toHaveBeenCalledTimes(1);
      expect(mockAiClient.generateIssueSummary).toHaveBeenCalledTimes(1);
      expect(mockAiClient.sendNotificationEmail).toHaveBeenCalledTimes(1);
    }
  });
});