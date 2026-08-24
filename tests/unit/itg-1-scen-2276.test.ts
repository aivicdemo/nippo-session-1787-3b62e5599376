import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput, DailyReportRecord } from '../../src/logic/monthly-performance-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2276: [normal] メンバー別生産性スコア計算機能 - 対象期間に報告したメンバーが1名の場合、そのメンバーの生産性スコアが算出される
  test('対象期間に報告を送信したメンバーが1名の場合、そのメンバーの生産性スコアが0～100の数値で算出される', () => {
    // Arrange: テストデータを設定
    const aggregationStartDate = new Date('2026-08-19T00:00:00Z');
    const aggregationEndDate = new Date('2026-08-19T23:59:59Z');
    const teamId = 'team-001';

    // メンバーA（REP001）の報告データを作成
    const reportRecord: DailyReportRecord = {
      reportId: 'REP001',
      memberId: 'memberA',
      teamId: teamId,
      reportDate: new Date('2026-08-19T09:00:00Z'),
      yesterdayAccomplishment: '機能Xの実装',
      todayPlan: 'テスト実施',
      issues: 'パフォーマンス改善',
      submissionStatus: 'submitted',
      submittedAt: new Date('2026-08-19T08:30:00Z'),
    };

    const reportDataset: DailyReportRecord[] = [reportRecord];

    // TextAnalysisServiceAdapterのスタブを準備
    const textAnalysisServiceStub = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['パフォーマンス改善'],
        frequency: 1,
        impactScore: 75,
      }),
      assessImpactScore: jest.fn().mockReturnValue(75),
      classifyIssueSeverity: jest.fn().mockReturnValue('high'),
    };

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds: [teamId],
      reportDataset,
    };

    // Act: 生産性スコア計算機能を呼び出す
    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(
      input,
      textAnalysisServiceStub
    );

    // Assert: 結果を検証
    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(result.teamMetrics).toHaveLength(1);

    const memberAMetric = result.teamMetrics[0];
    expect(memberAMetric.teamId).toBe(teamId);
    expect(memberAMetric.teamName).toBeDefined();

    // メンバーAの生産性スコアが0～100の範囲内であることを確認
    expect(typeof memberAMetric.priorityScore).toBe('number');
    expect(memberAMetric.priorityScore).toBeGreaterThanOrEqual(0);
    expect(memberAMetric.priorityScore).toBeLessThanOrEqual(100);

    // 報告3項目すべて入力済みの場合、入力完了度は100
    const reportInputCompletionScore = 100;

    // 報告内容の充実度（課題キーワード抽出による波及度スコア）は75（スタブから返却）
    const reportContentEnrichmentScore = 75;

    // 生産性スコアは両者の加重平均
    const expectedScore = Math.round((reportInputCompletionScore + reportContentEnrichmentScore) / 2);

    expect(memberAMetric.priorityScore).toBe(expectedScore);

    // 報告提出率は100%（1名中1名が提出）
    expect(memberAMetric.reportSubmissionRate).toBe(100);

    // 課題報告数は1件
    expect(memberAMetric.issueReportCount).toBe(1);

    // 集計期間が正しく設定されていることを確認
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);

    // データ品質スコアが0～100の範囲内であることを確認
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // TextAnalysisServiceAdapterが呼ばれたことを確認
    expect(textAnalysisServiceStub.extractKeywords).toHaveBeenCalledWith('パフォーマンス改善');
    expect(textAnalysisServiceStub.assessImpactScore).toHaveBeenCalledWith('パフォーマンス改善');
  });
});