import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析レポート生成 - データ品質不足時のスキップ', () => {
  // SCEN-1673
  test('日報件数が最小閾値未満かつデータ品質が不足しているとき分析スキップが返される', async () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-07T23:59:59Z');

    const insufficientInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-01',
      aggregationEndDate: '2024-01-07',
      extractedIssues: [
        {
          keyword: 'デプロイ失敗',
          occurrenceCount: 1,
          impactScore: 45,
        },
        {
          keyword: 'ネットワーク遅延',
          occurrenceCount: 2,
          impactScore: 30,
        },
        {
          keyword: 'メモリ不足',
          occurrenceCount: 1,
          impactScore: 50,
        },
      ],
      teamId: 'team-dev-001',
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn().mockResolvedValue(0),
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    const result = await generateWeeklyAnalysisReport(
      insufficientInput,
      mockTextAnalysisServiceAdapter,
      {
        minimumReportThreshold: 5,
        minimumQualityScore: 70,
      }
    );

    expect(result).toEqual({
      status: 'ANALYSIS_SKIPPED',
      skipReason: 'insufficient_data_volume_and_quality',
      message:
        '日報件数が閾値未満かつデータ品質が不足しているため、分析をスキップしました',
      analysisResult: null,
      generatedAt: expect.any(String),
    });

    expect(result.analysisResult).toBeNull();
  });
});