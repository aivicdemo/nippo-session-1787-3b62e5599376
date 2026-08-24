import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Extract Monthly Report Data', () => {
  // SCEN-2413: [edge] 日報データ集約・アーカイブ管理機能 - 集約期間の終了日を含む月末のとき、その月全体が期間内として集約対象に含まれる
  test('should include all reports within end-of-month period and exclude reports after the period', () => {
    const aggregation_start_date = new Date('2024-01-01T00:00:00Z');
    const aggregation_end_date = new Date('2024-01-31T23:59:59Z');
    const team_ids = ['TEAM_001'];

    const daily_report_records = [
      {
        reportId: 'REPORT_2024_01_01_A',
        teamId: 'TEAM_001',
        memberId: 'MEMBER_A',
        reportDate: new Date('2024-01-01T09:00:00Z'),
        yesterdayAccomplishment: 'Task A completed',
        todayPlan: 'Task B planned',
        issue: 'Issue 1',
      },
      {
        reportId: 'REPORT_2024_01_02_B',
        teamId: 'TEAM_001',
        memberId: 'MEMBER_B',
        reportDate: new Date('2024-01-02T09:00:00Z'),
        yesterdayAccomplishment: 'Task C completed',
        todayPlan: 'Task D planned',
        issue: 'Issue 2',
      },
      {
        reportId: 'REPORT_2024_01_03_C',
        teamId: 'TEAM_001',
        memberId: 'MEMBER_C',
        reportDate: new Date('2024-01-03T09:00:00Z'),
        yesterdayAccomplishment: 'Task E completed',
        todayPlan: 'Task F planned',
        issue: 'Issue 3',
      },
      {
        reportId: 'REPORT_2024_01_04_D',
        teamId: 'TEAM_001',
        memberId: 'MEMBER_D',
        reportDate: new Date('2024-01-04T09:00:00Z'),
        yesterdayAccomplishment: 'Task G completed',
        todayPlan: 'Task H planned',
        issue: 'Issue 4',
      },
      {
        reportId: 'REPORT_2024_01_05_E',
        teamId: 'TEAM_001',
        memberId: 'MEMBER_E',
        reportDate: new Date('2024-01-05T09:00:00Z'),
        yesterdayAccomplishment: 'Task I completed',
        todayPlan: 'Task J planned',
        issue: 'Issue 5',
      },
      {
        reportId: 'REPORT_2024_01_06_F',
        teamId: 'TEAM_001',
        memberId: 'MEMBER_F',
        reportDate: new Date('2024-01-06T09:00:00Z'),
        yesterdayAccomplishment: 'Task K completed',
        todayPlan: 'Task L planned',
        issue: 'Issue 6',
      },
      {
        reportId: 'REPORT_2024_01_07_G',
        teamId: 'TEAM_001',
        memberId: 'MEMBER_G',
        reportDate: new Date('2024-01-07T09:00:00Z'),
        yesterdayAccomplishment: 'Task M completed',
        todayPlan: 'Task N planned',
        issue: 'Issue 7',
      },
      {
        reportId: 'REPORT_2024_01_08_H',
        teamId: 'TEAM_001',
        memberId: 'MEMBER_H',
        reportDate: new Date('2024-01-08T09:00:00Z'),
        yesterdayAccomplishment: 'Task O completed',
        todayPlan: 'Task P planned',
        issue: 'Issue 8',
      },
      {
        reportId: 'REPORT_2024_01_09_I',
        teamId: 'TEAM_001',
        memberId: 'MEMBER_I',
        reportDate: new Date('2024-01-09T09:00:00Z'),
        yesterdayAccomplishment: 'Task Q completed',
        todayPlan: 'Task R planned',
        issue: 'Issue 9',
      },
      {
        reportId: 'REPORT_2024_01_31_J',
        teamId: 'TEAM_001',
        memberId: 'MEMBER_J',
        reportDate: new Date('2024-01-31T09:00:00Z'),
        yesterdayAccomplishment: 'Task S completed',
        todayPlan: 'Task T planned',
        issue: 'Issue 10',
      },
      {
        reportId: 'REPORT_2024_02_01_K',
        teamId: 'TEAM_001',
        memberId: 'MEMBER_K',
        reportDate: new Date('2024-02-01T09:00:00Z'),
        yesterdayAccomplishment: 'Task U completed',
        todayPlan: 'Task V planned',
        issue: 'Issue outside period',
      },
    ];

    const result = extractMonthlyReportData({
      aggregationStartDate: aggregation_start_date,
      aggregationEndDate: aggregation_end_date,
      teamIds: team_ids,
      reportRecords: daily_report_records,
    });

    expect(result.totalReportCount).toBe(10);
    expect(result.reportsByTeam).toHaveLength(1);
    expect(result.reportsByTeam[0].teamId).toBe('TEAM_001');
    expect(result.reportsByTeam[0].reportCount).toBe(10);
    expect(result.reportsByTeam[0].reportIds).toContain('REPORT_2024_01_01_A');
    expect(result.reportsByTeam[0].reportIds).toContain('REPORT_2024_01_02_B');
    expect(result.reportsByTeam[0].reportIds).toContain('REPORT_2024_01_03_C');
    expect(result.reportsByTeam[0].reportIds).toContain('REPORT_2024_01_04_D');
    expect(result.reportsByTeam[0].reportIds).toContain('REPORT_2024_01_05_E');
    expect(result.reportsByTeam[0].reportIds).toContain('REPORT_2024_01_06_F');
    expect(result.reportsByTeam[0].reportIds).toContain('REPORT_2024_01_07_G');
    expect(result.reportsByTeam[0].reportIds).toContain('REPORT_2024_01_08_H');
    expect(result.reportsByTeam[0].reportIds).toContain('REPORT_2024_01_09_I');
    expect(result.reportsByTeam[0].reportIds).toContain('REPORT_2024_01_31_J');
    expect(result.reportsByTeam[0].reportIds).not.toContain('REPORT_2024_02_01_K');
    expect(result.reportsByTeam[0].reportIds.length).toBe(10);
    expect(result.extractionPeriodStart).toBe('2024-01-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-01-31T23:59:59Z');
    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});