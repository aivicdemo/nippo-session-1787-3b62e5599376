import { describe, it, expect, beforeEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次パフォーマンス分析', () => {
  // SCEN-2320: [error] 課題解決速度分析機能 - 集約期間の開始日が null のとき処理を中止しエラーを返す
  it('should throw error with INVALID_START_DATE when aggregationStartDate is null', () => {
    const invalidStartDate: null = null;
    const validEndDate = new Date('2024-01-31T23:59:59Z');
    const teamIds = ['team-001', 'team-002'];
    const reportRecords = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        memberId: 'member-001',
        submissionDate: new Date('2024-01-15T08:30:00Z'),
        yesterdayAccomplishment: 'タスクA完了',
        todayPlan: 'タスクB実施',
        issue: 'データベース接続エラー',
      },
    ];

    expect(() =>
      extractMonthlyReportData({
        aggregationStartDate: invalidStartDate as any,
        aggregationEndDate: validEndDate,
        teamIds,
        reportRecords,
      })
    ).toThrow(/集約期間の開始日/);
  });
});