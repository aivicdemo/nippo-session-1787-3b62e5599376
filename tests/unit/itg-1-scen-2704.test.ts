import { fetchYesterdayReport } from '../../src/logic/report-submission';
import { type DailyReport } from '../../src/logic/report-submission';

describe('朝会報告管理システム - 前日報告内容の取得・表示機能', () => {
  // SCEN-2704
  test('複数の報告記録が存在する場合、前日報告のみが返され他日のデータは含まれない', async () => {
    const engineerId = 'engineer-001';
    const requestingUserId = 'manager-001';
    
    // テスト実行日を 2024-01-15 に設定し、前日（2024-01-14）の報告を取得
    const targetDate = new Date('2024-01-15T00:00:00Z');
    const expectedReportDate = new Date('2024-01-14T00:00:00Z');
    
    // テスト用データベースに事前登録された報告記録
    // - 2024-01-15: 1件
    // - 2024-01-14: 3件（期待対象）
    // - 2024-01-13: 2件
    
    const mockReports: DailyReport[] = [
      {
        reportId: 'report-2024-01-15-001',
        engineerId: engineerId,
        reportDate: new Date('2024-01-15T00:00:00Z'),
        yesterdayAccomplishment: 'Completed feature A',
        todayPlan: 'Work on feature B',
        challenges: 'Database performance issue',
        submittedAt: new Date('2024-01-15T09:00:00Z'),
      },
      {
        reportId: 'report-2024-01-14-001',
        engineerId: engineerId,
        reportDate: new Date('2024-01-14T00:00:00Z'),
        yesterdayAccomplishment: 'Completed API endpoint',
        todayPlan: 'Refactor database queries',
        challenges: 'Schema migration delays',
        submittedAt: new Date('2024-01-14T09:00:00Z'),
      },
      {
        reportId: 'report-2024-01-14-002',
        engineerId: engineerId,
        reportDate: new Date('2024-01-14T00:00:00Z'),
        yesterdayAccomplishment: 'Fixed login bug',
        todayPlan: 'Test payment integration',
        challenges: 'Third-party API timeout',
        submittedAt: new Date('2024-01-14T09:15:00Z'),
      },
      {
        reportId: 'report-2024-01-14-003',
        engineerId: engineerId,
        reportDate: new Date('2024-01-14T00:00:00Z'),
        yesterdayAccomplishment: 'Code review completed',
        todayPlan: 'Deploy to staging',
        challenges: 'Deployment script error',
        submittedAt: new Date('2024-01-14T09:30:00Z'),
      },
      {
        reportId: 'report-2024-01-13-001',
        engineerId: engineerId,
        reportDate: new Date('2024-01-13T00:00:00Z'),
        yesterdayAccomplishment: 'Unit tests written',
        todayPlan: 'Integration testing',
        challenges: 'Test environment setup',
        submittedAt: new Date('2024-01-13T09:00:00Z'),
      },
      {
        reportId: 'report-2024-01-13-002',
        engineerId: engineerId,
        reportDate: new Date('2024-01-13T00:00:00Z'),
        yesterdayAccomplishment: 'Documentation updated',
        todayPlan: 'Code review',
        challenges: 'Unclear requirements',
        submittedAt: new Date('2024-01-13T09:45:00Z'),
      },
    ];

    // 前日報告取得APIを呼び出す
    const result = await fetchYesterdayReport({
      engineerId: engineerId,
      targetDate: targetDate,
      requestingUserId: requestingUserId,
    });

    // 期待結果を検証：2024-01-14 の報告が正確に 3 件含まれること
    expect(result).toHaveLength(3);

    // すべての返却レコードの reportDate が 2024-01-14 であることを確認
    result.forEach((report) => {
      expect(report.reportDate).toEqual(expectedReportDate);
    });

    // 返却された報告記録が正確に 2024-01-14 のもの（3 件）であることを検証
    const returnedIds = result.map((r) => r.reportId).sort();
    const expectedIds = [
      'report-2024-01-14-001',
      'report-2024-01-14-002',
      'report-2024-01-14-003',
    ].sort();
    expect(returnedIds).toEqual(expectedIds);

    // 2024-01-15 と 2024-01-13 のデータが含まれていないことを確認
    expect(result.some((r) => r.reportDate.toISOString().startsWith('2024-01-15'))).toBe(
      false
    );
    expect(result.some((r) => r.reportDate.toISOString().startsWith('2024-01-13'))).toBe(
      false
    );
  });
});