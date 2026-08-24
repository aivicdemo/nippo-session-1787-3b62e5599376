import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import { type MonthlyReportDataset } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次報告データ集約機能', () => {
  // SCEN-2415: [edge] 日報データ集約・アーカイブ管理機能 - 集約期間が前年度から当年度にまたがるとき、両年度のデータが同一の集約対象に含まれる
  test('集約期間が前年度と当年度にまたがる場合、両年度のデータが統合されて集約される', () => {
    // 前年度（2024年4月1日～2025年3月31日）のユーザーAの日報データ5件を準備
    const previousFiscalYearReports = [
      {
        reportId: 'report-fy2024-001',
        userId: 'user-a-001',
        teamId: 'team-dev-001',
        reportDate: new Date('2025-03-01T09:00:00Z'),
        yesterday: '前日の成果レポート1',
        today: '本日の計画1',
        issues: '課題キーワード1',
        createdAt: new Date('2025-03-01T09:15:00Z'),
      },
      {
        reportId: 'report-fy2024-002',
        userId: 'user-a-001',
        teamId: 'team-dev-001',
        reportDate: new Date('2025-03-05T09:00:00Z'),
        yesterday: '前日の成果レポート2',
        today: '本日の計画2',
        issues: '課題キーワード2',
        createdAt: new Date('2025-03-05T09:15:00Z'),
      },
      {
        reportId: 'report-fy2024-003',
        userId: 'user-a-001',
        teamId: 'team-dev-001',
        reportDate: new Date('2025-03-10T09:00:00Z'),
        yesterday: '前日の成果レポート3',
        today: '本日の計画3',
        issues: '課題キーワード3',
        createdAt: new Date('2025-03-10T09:15:00Z'),
      },
      {
        reportId: 'report-fy2024-004',
        userId: 'user-a-001',
        teamId: 'team-dev-001',
        reportDate: new Date('2025-03-15T09:00:00Z'),
        yesterday: '前日の成果レポート4',
        today: '本日の計画4',
        issues: '課題キーワード4',
        createdAt: new Date('2025-03-15T09:15:00Z'),
      },
      {
        reportId: 'report-fy2024-005',
        userId: 'user-a-001',
        teamId: 'team-dev-001',
        reportDate: new Date('2025-03-20T09:00:00Z'),
        yesterday: '前日の成果レポート5',
        today: '本日の計画5',
        issues: '課題キーワード5',
        createdAt: new Date('2025-03-20T09:15:00Z'),
      },
    ];

    // 当年度（2025年4月1日～2026年3月31日）のユーザーAの日報データ5件を準備
    const currentFiscalYearReports = [
      {
        reportId: 'report-fy2025-001',
        userId: 'user-a-001',
        teamId: 'team-dev-001',
        reportDate: new Date('2025-04-01T09:00:00Z'),
        yesterday: '前日の成果レポート1（当年度）',
        today: '本日の計画1（当年度）',
        issues: '課題キーワード1（当年度）',
        createdAt: new Date('2025-04-01T09:15:00Z'),
      },
      {
        reportId: 'report-fy2025-002',
        userId: 'user-a-001',
        teamId: 'team-dev-001',
        reportDate: new Date('2025-04-05T09:00:00Z'),
        yesterday: '前日の成果レポート2（当年度）',
        today: '本日の計画2（当年度）',
        issues: '課題キーワード2（当年度）',
        createdAt: new Date('2025-04-05T09:15:00Z'),
      },
      {
        reportId: 'report-fy2025-003',
        userId: 'user-a-001',
        teamId: 'team-dev-001',
        reportDate: new Date('2025-04-10T09:00:00Z'),
        yesterday: '前日の成果レポート3（当年度）',
        today: '本日の計画3（当年度）',
        issues: '課題キーワード3（当年度）',
        createdAt: new Date('2025-04-10T09:15:00Z'),
      },
      {
        reportId: 'report-fy2025-004',
        userId: 'user-a-001',
        teamId: 'team-dev-001',
        reportDate: new Date('2025-04-15T09:00:00Z'),
        yesterday: '前日の成果レポート4（当年度）',
        today: '本日の計画4（当年度）',
        issues: '課題キーワード4（当年度）',
        createdAt: new Date('2025-04-15T09:15:00Z'),
      },
      {
        reportId: 'report-fy2025-005',
        userId: 'user-a-001',
        teamId: 'team-dev-001',
        reportDate: new Date('2025-04-20T09:00:00Z'),
        yesterday: '前日の成果レポート5（当年度）',
        today: '本日の計画5（当年度）',
        issues: '課題キーワード5（当年度）',
        createdAt: new Date('2025-04-20T09:15:00Z'),
      },
    ];

    // 集約対象に前年度と当年度のデータを統合
    const allReports = [...previousFiscalYearReports, ...currentFiscalYearReports];

    // 集約パラメータ：集約期間を2025年3月1日～2025年4月30日に設定（前年度と当年度にまたがる）
    const aggregationStartDate = new Date('2025-03-01T00:00:00Z');
    const aggregationEndDate = new Date('2025-04-30T23:59:59Z');
    const targetYear = 2025;
    const targetMonth = 3;
    const requestedByUserId = 'user-a-001';
    const teamIdFilter = ['team-dev-001'];

    // 集約実行API呼び出し
    const result = extractMonthlyReportData({
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter,
    });

    // 期待結果の検証

    // 1. 集約結果が MonthlyReportDataset 型であることを確認
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    // 2. 集約期間が正しく設定されていることを確認
    expect(result.extractionPeriodStart).toBeDefined();
    expect(result.extractionPeriodEnd).toBeDefined();

    // 3. 前年度データ（2025年3月1日～3月31日分）が5件含まれていることを検証
    // 4. 当年度データ（2025年4月1日～4月30日分）が5件含まれていることを検証
    // 合計10件の日報が集約されていることを確認
    expect(result.totalReportCount).toBe(10);

    // 5. チーム別集約結果の検証
    expect(Array.isArray(result.reportsByTeam)).toBe(true);
    expect(result.reportsByTeam.length).toBeGreaterThan(0);

    const teamDevReport = result.reportsByTeam.find(
      (team) => team.teamId === 'team-dev-001'
    );
    expect(teamDevReport).toBeDefined();

    // チーム内の日報件数が10件であることを確認
    if (teamDevReport) {
      expect(teamDevReport.reportCount).toBe(10);

      // 集約対象に含まれる日報IDリストが10件であることを確認
      expect(Array.isArray(teamDevReport.reportIds)).toBe(true);
      expect(teamDevReport.reportIds.length).toBe(10);

      // 前年度データのIDが含まれていることを確認
      expect(teamDevReport.reportIds).toContain('report-fy2024-001');
      expect(teamDevReport.reportIds).toContain('report-fy2024-002');
      expect(teamDevReport.reportIds).toContain('report-fy2024-003');
      expect(teamDevReport.reportIds).toContain('report-fy2024-004');
      expect(teamDevReport.reportIds).toContain('report-fy2024-005');

      // 当年度データのIDが含まれていることを確認
      expect(teamDevReport.reportIds).toContain('report-fy2025-001');
      expect(teamDevReport.reportIds).toContain('report-fy2025-002');
      expect(teamDevReport.reportIds).toContain('report-fy2025-003');
      expect(teamDevReport.reportIds).toContain('report-fy2025-004');
      expect(teamDevReport.reportIds).toContain('report-fy2025-005');

      // 提出率が計算されていることを確認（10件中10件提出 = 100%）
      expect(typeof teamDevReport.submissionRate).toBe('number');
      expect(teamDevReport.submissionRate).toBeGreaterThanOrEqual(0);
      expect(teamDevReport.submissionRate).toBeLessThanOrEqual(100);
    }

    // 6. データ品質スコアが0～100の範囲内であることを確認
    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 7. 集約実行日時がタイムスタンプとして記録されていることを確認
    expect(result.extractedAt).toBeDefined();
    expect(typeof result.extractedAt).toBe('string');

    // ISO 8601形式の日時文字列であることを確認
    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate instanceof Date).toBe(true);
    expect(isNaN(extractedAtDate.getTime())).toBe(false);
  });
});