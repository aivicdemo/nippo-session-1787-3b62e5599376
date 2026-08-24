import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム', () => {
  // SCEN-2410: [edge] 日報データ集約・アーカイブ管理機能 - 集約期間の開始日と終了日が同日のとき、その1日分のデータのみが集約対象に含まれる
  test('集約対象期間の開始日と終了日が同日のとき、その1日分のデータのみが集約対象に含まれる', () => {
    const aggregationStartDate = new Date('2024-10-15T00:00:00Z');
    const aggregationEndDate = new Date('2024-10-15T23:59:59Z');

    const reportRecords = [
      {
        reportId: 'report_001',
        memberId: 'member_001',
        submissionDate: new Date('2024-10-15T09:30:00Z'),
        yesterdayAccomplishment: 'Task A completed',
        todayPlan: 'Task B scheduled',
        challengeIssue: 'Issue 1',
      },
      {
        reportId: 'report_002',
        memberId: 'member_002',
        submissionDate: new Date('2024-10-15T09:35:00Z'),
        yesterdayAccomplishment: 'Task C completed',
        todayPlan: 'Task D scheduled',
        challengeIssue: 'Issue 2',
      },
      {
        reportId: 'report_003',
        memberId: 'member_003',
        submissionDate: new Date('2024-10-15T09:40:00Z'),
        yesterdayAccomplishment: 'Task E completed',
        todayPlan: 'Task F scheduled',
        challengeIssue: 'Issue 3',
      },
      {
        reportId: 'report_004',
        memberId: 'member_004',
        submissionDate: new Date('2024-10-15T09:45:00Z'),
        yesterdayAccomplishment: 'Task G completed',
        todayPlan: 'Task H scheduled',
        challengeIssue: 'Issue 4',
      },
      {
        reportId: 'report_005',
        memberId: 'member_005',
        submissionDate: new Date('2024-10-15T09:50:00Z'),
        yesterdayAccomplishment: 'Task I completed',
        todayPlan: 'Task J scheduled',
        challengeIssue: 'Issue 5',
      },
      {
        reportId: 'report_006',
        memberId: 'member_001',
        submissionDate: new Date('2024-10-14T09:30:00Z'),
        yesterdayAccomplishment: 'Task K completed',
        todayPlan: 'Task L scheduled',
        challengeIssue: 'Issue 6',
      },
      {
        reportId: 'report_007',
        memberId: 'member_002',
        submissionDate: new Date('2024-10-16T09:30:00Z'),
        yesterdayAccomplishment: 'Task M completed',
        todayPlan: 'Task N scheduled',
        challengeIssue: 'Issue 7',
      },
    ];

    const result = extractMonthlyReportData({
      aggregationStartDate,
      aggregationEndDate,
      reportRecords,
    });

    expect(result.extractedRecords).toHaveLength(5);

    result.extractedRecords.forEach((record) => {
      expect(record.submissionDate.toISOString()).toMatch(/2024-10-15/);
    });

    const extractedReportIds = result.extractedRecords.map((r) => r.reportId);
    expect(extractedReportIds).toEqual([
      'report_001',
      'report_002',
      'report_003',
      'report_004',
      'report_005',
    ]);

    expect(extractedReportIds).not.toContain('report_006');
    expect(extractedReportIds).not.toContain('report_007');
  });
});