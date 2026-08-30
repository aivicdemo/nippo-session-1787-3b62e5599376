import { validateReportQuality } from '../../src/logic/report-quality-validation';

describe('朝会報告管理システム - レポート品質検証', () => {
  // SCEN-500
  test('対策案のタイトルが空文字列のとき、エラーメッセージを含む例外を発生させる', () => {
    const reportId = 'report-123';
    const reportContent = {
      sections: ['summary', 'analysis', 'recommendations'],
      data: {
        issueCount: 5,
        averagePriority: 7.2
      },
      analysisResults: {
        trends: 'increasing',
        keyFindings: ['Issue A detected', 'Risk B identified']
      }
    };
    const sourceReportDataset = {
      dailyReports: [
        {
          reportId: 'daily-1',
          date: '2024-01-15',
          extractedIssues: ['Issue A', 'Issue B'],
          frequency: 2
        }
      ],
      aggregatedMetrics: {
        totalIssues: 5,
        averageFrequency: 1.5
      }
    };
    const validationCriteria = {
      requiredSections: ['summary', 'analysis', 'recommendations'],
      accuracyThreshold: 5,
      requiredUtilityElements: ['trend_analysis', 'priority_scoring']
    };

    expect(() =>
      validateReportQuality({
        reportId,
        reportContent,
        sourceReportDataset,
        validationCriteria
      })
    ).toThrow(/対策案のタイトル/);
  });
});