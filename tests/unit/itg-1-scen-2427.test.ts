import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2427: [normal] 分析結果確定監査ログ記録機能 - 複数課題の優先度判定ロジックバージョンが異なる場合、その全てが監査ログに記録される
  test('should record audit log entries for multiple issues with different priority judgment logic versions', async () => {
    const reportId = 'report-2427-001';
    const approverUserId = 'user-dept-head-001';
    const approvalStatus = 'approved' as const;

    const approvalInput = {
      reportId,
      approvalStatus,
      approverUserId,
    };

    const result = await validateMonthlyReportApproval(approvalInput);

    expect(result).toBeDefined();
    expect(result.reportId).toBe(reportId);
    expect(result.approvalStatus).toBe('approved');
    expect(result.processedAt).toBeInstanceOf(Date);
    expect(result.nextAction).toBe('proceed_to_management_report');
    expect(result.auditTrail).toBeDefined();

    const auditLogEntries = result.auditTrail;
    expect(Array.isArray(auditLogEntries)).toBe(true);

    const issueAEntry = auditLogEntries.find(
      (entry: any) => entry.issueId === 'issue-A' && entry.logicVersion === 'v1.0'
    );
    expect(issueAEntry).toBeDefined();
    expect(issueAEntry?.executedBy).toBe(approverUserId);
    expect(issueAEntry?.priorityJudgmentResult).toBe(45);
    expect(issueAEntry?.severity).toBe('medium');
    expect(issueAEntry?.timestamp).toBeInstanceOf(Date);

    const issueBEntry = auditLogEntries.find(
      (entry: any) => entry.issueId === 'issue-B' && entry.logicVersion === 'v2.0'
    );
    expect(issueBEntry).toBeDefined();
    expect(issueBEntry?.executedBy).toBe(approverUserId);
    expect(issueBEntry?.priorityJudgmentResult).toBe(72);
    expect(issueBEntry?.severity).toBe('high');
    expect(issueBEntry?.timestamp).toBeInstanceOf(Date);

    const issueCEntry = auditLogEntries.find(
      (entry: any) => entry.issueId === 'issue-C' && entry.logicVersion === 'v1.0'
    );
    expect(issueCEntry).toBeDefined();
    expect(issueCEntry?.executedBy).toBe(approverUserId);
    expect(issueCEntry?.priorityJudgmentResult).toBe(38);
    expect(issueCEntry?.severity).toBe('medium');
    expect(issueCEntry?.timestamp).toBeInstanceOf(Date);

    expect(auditLogEntries.length).toBe(3);

    const versionV10Entries = auditLogEntries.filter((entry: any) => entry.logicVersion === 'v1.0');
    expect(versionV10Entries.length).toBe(2);
    expect(versionV10Entries.map((e: any) => e.issueId)).toEqual(
      expect.arrayContaining(['issue-A', 'issue-C'])
    );

    const versionV20Entries = auditLogEntries.filter((entry: any) => entry.logicVersion === 'v2.0');
    expect(versionV20Entries.length).toBe(1);
    expect(versionV20Entries[0]?.issueId).toBe('issue-B');

    const allEntriesSorted = auditLogEntries.sort((a: any, b: any) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    expect(allEntriesSorted[0]?.timestamp).toBeLessThanOrEqual(allEntriesSorted[1]?.timestamp);
    expect(allEntriesSorted[1]?.timestamp).toBeLessThanOrEqual(allEntriesSorted[2]?.timestamp);
  });
});