import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import type {
  BottleneckAnalysisInput,
  IssueTimeSeriesRecord,
  BottleneckTrendAnalysisResult,
} from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-2384: [edge] 課題解決速度の定量化 - 同一の課題が集約期間内で継続して報告されたとき、解決までの期間日数を計算する
  test('同一キーワードが初回報告から最終報告まで連続して報告された場合、解決までの期間として計算され、翌日以降の報告がないため課題の解決完了判定が確定される', () => {
    // Arrange: テストデータを準備
    const analysisStartDate = new Date('2026-01-01T00:00:00Z');
    const analysisEndDate = new Date('2026-01-07T23:59:59Z');
    const issueId = 'issue-db-connection-error-001';

    // 同一キーワード『データベース接続エラー』が2026-01-01から2026-01-06まで毎日報告されたレコード6件
    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId,
        recordDate: new Date('2026-01-01'),
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'open',
      },
      {
        issueId,
        recordDate: new Date('2026-01-02'),
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'open',
      },
      {
        issueId,
        recordDate: new Date('2026-01-03'),
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open',
      },
      {
        issueId,
        recordDate: new Date('2026-01-04'),
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'open',
      },
      {
        issueId,
        recordDate: new Date('2026-01-05'),
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 4,
        resolutionStatus: 'open',
      },
      {
        issueId,
        recordDate: new Date('2026-01-06'),
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 5,
        resolutionStatus: 'in_progress',
      },
      // 2026-01-07に同じキーワードの報告がない（課題が解決されたと判定）
    ];

    const analysisInput: BottleneckAnalysisInput = {
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      minimumDataPointsThreshold: 7,
      outlierDetectionEnabled: false,
    };

    // Act: 課題解決速度計算ロジックを実行
    const result: BottleneckTrendAnalysisResult =
      analyzeBottleneckTrendWithTimeSeries(analysisInput);

    // Assert: 解決までの期間として『6日間』が計算されていることを検証
    // 期間計算 = 最終報告日(2026-01-06) - 初回報告日(2026-01-01) + 1 = 6日間
    expect(result.issueId).toBe(issueId);
    expect(result.averageResolutionDays).toBe(6);
    expect(result.peakOccurrenceDate).toEqual(new Date('2026-01-01'));
    expect(result.timeSeriesTrendData).toHaveLength(6);

    // 最初の日付が2026-01-01であることを確認
    const firstTrendPoint = result.timeSeriesTrendData[0];
    expect(firstTrendPoint.date).toEqual(new Date('2026-01-01'));
    expect(firstTrendPoint.occurrenceCount).toBe(1);
    expect(firstTrendPoint.impactScore).toBe(75);
    expect(firstTrendPoint.resolutionRate).toBe(0);

    // 最後の日付が2026-01-06であることを確認
    const lastTrendPoint = result.timeSeriesTrendData[5];
    expect(lastTrendPoint.date).toEqual(new Date('2026-01-06'));
    expect(lastTrendPoint.occurrenceCount).toBe(1);
    expect(lastTrendPoint.impactScore).toBe(75);
  });
});