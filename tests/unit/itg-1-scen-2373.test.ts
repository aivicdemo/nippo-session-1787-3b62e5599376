import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 課題キーワード抽出と発生頻度ランク付け', () => {
  test('SCEN-2373: [error] 発生頻度の計算値が負の数になったとき処理がエラーになる', () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          {
            keyword: 'システムダウン',
            frequency: -5,
            confidence: 0.95,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockReturnValue(85),
      classifyIssueSeverity: jest.fn().mockReturnValue('high'),
    };

    const monthlyReportInput = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      teamIdFilter: undefined,
    };

    const sampleReports = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        reportDate: new Date('2024-01-15T09:00:00Z'),
        yesterdayWork: 'システム改善を実施',
        todayWork: 'テスト実施予定',
        issues: 'システムダウンが発生した',
      },
      {
        reportId: 'report-002',
        teamId: 'team-001',
        reportDate: new Date('2024-01-16T09:00:00Z'),
        yesterdayWork: 'バグ修正',
        todayWork: 'デプロイ予定',
        issues: 'システムダウンが再発生',
      },
    ];

    // Act & Assert
    expect(() =>
      extractMonthlyReportData(monthlyReportInput, mockTextAnalysisServiceAdapter, sampleReports)
    ).toThrow(/キーワード出現頻度が不正です/);
  });
});