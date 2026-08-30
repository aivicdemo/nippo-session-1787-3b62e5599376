import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';
import { type ProductivityMetricsOutput, type DataQualityAssessment } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-599: 指定された集約期間内の日報データから生産性指標を計算する - 提出記録データが計測期間と一致しないときの警告検出
  test('集約期間と提出記録の日付範囲が一致しない場合、警告を記録しつつ生産性指標を正常に計算する', () => {
    // テスト準備: 集約期間を2024年1月1日～2024年1月31日に設定
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');

    // テスト準備: 対象チームIDを設定
    const targetTeamIds = ['team-001'];

    // テスト準備: 提出記録データを集約期間外の日付を含めて構成
    // 記録1件目: 2023年12月25日（集約期間外・過去）
    // 記録2件目: 2024年1月15日（集約期間内）
    // 記録3件目: 2024年2月10日（集約期間外・未来）
    const submissionRecords = [
      { memberId: 'emp-001', submittedAt: new Date('2023-12-25T09:00:00Z') },
      { memberId: 'emp-002', submittedAt: new Date('2024-01-15T09:30:00Z') },
      { memberId: 'emp-003', submittedAt: new Date('2024-02-10T10:00:00Z') },
    ];

    // テスト実行: calculateProductivityMetricsを呼び出し
    const result = calculateProductivityMetrics({
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      excludeOutliers: false,
      submissionData: submissionRecords,
    });

    // 期待結果: 関数は正常に完了し、ProductivityMetricsOutput型の戻り値を返す
    expect(result).toBeDefined();
    expect(typeof result.issueResolutionSpeed).toBe('number');
    expect(typeof result.reportSubmissionRate).toBe('number');
    expect(typeof result.issueRecurrenceRate).toBe('number');
    expect(typeof result.teamProductivityScore).toBe('number');

    // 期待結果: 各メトリクスが妥当な範囲内
    expect(result.issueResolutionSpeed).toBeGreaterThanOrEqual(0);
    expect(result.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(result.reportSubmissionRate).toBeLessThanOrEqual(100);
    expect(result.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(result.issueRecurrenceRate).toBeLessThanOrEqual(100);
    expect(result.teamProductivityScore).toBeGreaterThanOrEqual(0);
    expect(result.teamProductivityScore).toBeLessThanOrEqual(100);

    // 期待結果: dataQualityAssessmentが含まれている
    expect(result.dataQualityAssessment).toBeDefined();
    expect(typeof result.dataQualityAssessment.completenessPercentage).toBe('number');
    expect(typeof result.dataQualityAssessment.extractionAccuracy).toBe('number');
    expect(typeof result.dataQualityAssessment.isReportable).toBe('boolean');

    // 期待結果: 提出記録の日付範囲が計測期間と一致していないことが警告として検出される
    // 提出記録の日付範囲は2023-12-25～2024-02-10、集約期間は2024-01-01～2024-01-31
    expect(result.dataQualityAssessment.isReportable).toBe(false);

    // 期待結果: エラーは発生せず、計算は実行される（計算結果が返却される）
    expect(result).toHaveProperty('issueResolutionSpeed');
    expect(result).toHaveProperty('reportSubmissionRate');
    expect(result).toHaveProperty('issueRecurrenceRate');
    expect(result).toHaveProperty('teamProductivityScore');
    expect(result).toHaveProperty('dataQualityAssessment');
  });
});