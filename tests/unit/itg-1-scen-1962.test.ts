import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import { type IssueTimeSeriesRecord, type BottleneckTrendAnalysisResult, type DailyTrendPoint } from '../../src/logic/monthly-performance-analysis';

describe('月初日を含む分析期間で前月データが分離される', () => {
  // SCEN-1962
  test('2024-02-01 ～ 2024-02-02の分析期間で1月31日のデータが完全に分離される', () => {
    // テストデータ準備：1月31日、2月1日、2月2日のそれぞれに5件ずつレコード作成
    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      // 1月31日分（5件）- 分析対象外
      {
        issueId: 'issue-jan-01',
        recordDate: new Date('2024-01-31'),
        occurrenceCount: 3,
        impactScore: 75,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-jan-02',
        recordDate: new Date('2024-01-31'),
        occurrenceCount: 2,
        impactScore: 60,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'in_progress',
      },
      {
        issueId: 'issue-jan-03',
        recordDate: new Date('2024-01-31'),
        occurrenceCount: 4,
        impactScore: 80,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-jan-04',
        recordDate: new Date('2024-01-31'),
        occurrenceCount: 2,
        impactScore: 50,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-jan-05',
        recordDate: new Date('2024-01-31'),
        occurrenceCount: 3,
        impactScore: 70,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open',
      },

      // 2月1日分（5件）- 分析対象に含む
      {
        issueId: 'issue-feb-01',
        recordDate: new Date('2024-02-01'),
        occurrenceCount: 2,
        impactScore: 65,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-feb-02',
        recordDate: new Date('2024-02-01'),
        occurrenceCount: 3,
        impactScore: 85,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'in_progress',
      },
      {
        issueId: 'issue-feb-03',
        recordDate: new Date('2024-02-01'),
        occurrenceCount: 1,
        impactScore: 55,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-feb-04',
        recordDate: new Date('2024-02-01'),
        occurrenceCount: 2,
        impactScore: 70,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-feb-05',
        recordDate: new Date('2024-02-01'),
        occurrenceCount: 3,
        impactScore: 75,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'open',
      },

      // 2月2日分（5件）- 分析対象に含む
      {
        issueId: 'issue-feb2-01',
        recordDate: new Date('2024-02-02'),
        occurrenceCount: 4,
        impactScore: 90,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-feb2-02',
        recordDate: new Date('2024-02-02'),
        occurrenceCount: 2,
        impactScore: 60,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'in_progress',
      },
      {
        issueId: 'issue-feb2-03',
        recordDate: new Date('2024-02-02'),
        occurrenceCount: 3,
        impactScore: 72,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-feb2-04',
        recordDate: new Date('2024-02-02'),
        occurrenceCount: 1,
        impactScore: 50,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-feb2-05',
        recordDate: new Date('2024-02-02'),
        occurrenceCount: 2,
        impactScore: 68,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open',
      },
    ];

    // 分析期間を2024-02-01 ～ 2024-02-02に設定（月初日を含む）
    const analysisStartDate = new Date('2024-02-01T00:00:00Z');
    const analysisEndDate = new Date('2024-02-02T23:59:59Z');

    // 関数実行
    const result: BottleneckTrendAnalysisResult = analyzeBottleneckTrendWithTimeSeries(
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      7,
      true
    );

    // 検証1：timeSeriesTrendDataが分析期間内の2つの日付のみを含むことを確認
    expect(result.timeSeriesTrendData.length).toBe(2);

    // 検証2：timeSeriesTrendDataの日付が2024-02-01と2024-02-02のみであることを確認
    const includedDates = result.timeSeriesTrendData.map((point: DailyTrendPoint) =>
      point.date.toISOString().split('T')[0]
    );
    expect(includedDates).toEqual(['2024-02-01', '2024-02-02']);

    // 検証3：1月31日のデータが一切含まれていないことを確認
    const hasJanuaryData = result.timeSeriesTrendData.some(
      (point: DailyTrendPoint) => point.date.toISOString().split('T')[0] === '2024-01-31'
    );
    expect(hasJanuaryData).toBe(false);

    // 検証4：2月1日のデータが正確に集計されていることを確認
    const februaryFirstData = result.timeSeriesTrendData.find(
      (point: DailyTrendPoint) => point.date.toISOString().split('T')[0] === '2024-02-01'
    );
    expect(februaryFirstData).toBeDefined();
    if (februaryFirstData) {
      // 2月1日のレコードは5件、occurrenceCountの合計は 2+3+1+2+3 = 11
      expect(februaryFirstData.occurrenceCount).toBe(11);
      // impactScoreの平均は (65+85+55+70+75)/5 = 70
      expect(februaryFirstData.impactScore).toBe(70);
    }

    // 検証5：2月2日のデータが正確に集計されていることを確認
    const februarySecondData = result.timeSeriesTrendData.find(
      (point: DailyTrendPoint) => point.date.toISOString().split('T')[0] === '2024-02-02'
    );
    expect(februarySecondData).toBeDefined();
    if (februarySecondData) {
      // 2月2日のレコードは5件、occurrenceCountの合計は 4+2+3+1+2 = 12
      expect(februarySecondData.occurrenceCount).toBe(12);
      // impactScoreの平均は (90+60+72+50+68)/5 = 68
      expect(februarySecondData.impactScore).toBe(68);
    }

    // 検証6：ボトルネック深刻度スコアが算出されていることを確認
    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);

    // 検証7：ボトルネック深刻度ランクが正しく判定されていることを確認
    expect(['critical', 'high', 'medium', 'low']).toContain(result.bottleneckSeverityRank);

    // 検証8：改善傾向が判定されていることを確認
    expect(['improving', 'stable', 'deteriorating']).toContain(result.improvementTrend);

    // 検証9：ピーク発生日付が分析期間内であることを確認
    const peakDateString = result.peakOccurrenceDate.toISOString().split('T')[0];
    expect(['2024-02-01', '2024-02-02']).toContain(peakDateString);

    // 検証10：平均解決日数が計算されていることを確認
    expect(result.averageResolutionDays).toBeGreaterThan(0);
  });
});