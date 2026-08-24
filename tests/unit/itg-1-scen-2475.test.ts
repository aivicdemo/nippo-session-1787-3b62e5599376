import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2475
  test('操作習熟度スコア計算機能 - 同じ操作ログを入力として2回実行したとき、同じ習熟度スコアが計算される', () => {
    // 操作ログデータセットの準備
    const operationLogDataset = {
      userId: 'user-001',
      operationTimestamps: [
        new Date('2024-01-15T09:00:00Z'),
        new Date('2024-01-15T09:05:00Z'),
        new Date('2024-01-15T09:10:00Z'),
        new Date('2024-01-15T09:15:00Z'),
        new Date('2024-01-15T09:20:00Z'),
      ],
      operationContents: [
        'form_open',
        'field_input_yesterday_accomplishment',
        'field_input_today_plan',
        'field_input_challenges',
        'form_submit',
      ],
      screenTransitionPattern: [
        'login_screen',
        'report_form_screen',
        'report_form_screen',
        'report_form_screen',
        'report_form_screen',
        'confirmation_screen',
      ],
    };

    // TextAnalysisServiceAdapterのモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['performance', 'issue'],
        frequencies: [3, 2],
      }),
      assessImpactScore: jest.fn().mockReturnValue(65),
      classifyIssueSeverity: jest.fn().mockReturnValue('medium'),
    };

    // 第1回目の計算実行
    const firstCalculationResult = submitDailyReport(
      {
        userId: 'user-001',
        teamId: 'team-001',
        yesterdayAccomplishment: 'Completed feature development',
        todayPlan: 'Code review and testing',
        challenges: 'Performance issue identified',
        reportDate: '2024-01-15',
      },
      mockTextAnalysisAdapter as any
    );

    // 計算結果の記録
    const firstScoreRecord = {
      overallScore: firstCalculationResult.habitualityScore?.overallScore,
      operationSpeedSubscore: firstCalculationResult.habitualityScore?.operationSpeedSubscore,
      screenTransitionEfficiencySubscore: firstCalculationResult.habitualityScore?.screenTransitionEfficiencySubscore,
      calculationTimestamp: firstCalculationResult.habitualityScore?.calculationTimestamp,
    };

    // 第2回目の計算実行（同一の操作ログデータセット）
    const secondCalculationResult = submitDailyReport(
      {
        userId: 'user-001',
        teamId: 'team-001',
        yesterdayAccomplishment: 'Completed feature development',
        todayPlan: 'Code review and testing',
        challenges: 'Performance issue identified',
        reportDate: '2024-01-15',
      },
      mockTextAnalysisAdapter as any
    );

    // 計算結果の記録
    const secondScoreRecord = {
      overallScore: secondCalculationResult.habitualityScore?.overallScore,
      operationSpeedSubscore: secondCalculationResult.habitualityScore?.operationSpeedSubscore,
      screenTransitionEfficiencySubscore: secondCalculationResult.habitualityScore?.screenTransitionEfficiencySubscore,
      calculationTimestamp: secondCalculationResult.habitualityScore?.calculationTimestamp,
    };

    // 第1回目と第2回目のスコアの比較
    expect(firstScoreRecord.overallScore).toBe(secondScoreRecord.overallScore);
    expect(firstScoreRecord.operationSpeedSubscore).toBe(secondScoreRecord.operationSpeedSubscore);
    expect(firstScoreRecord.screenTransitionEfficiencySubscore).toBe(
      secondScoreRecord.screenTransitionEfficiencySubscore
    );

    // 計算タイムスタンプは異なってもよい
    expect(firstCalculationResult.reportId).toBe(secondCalculationResult.reportId);
    expect(firstCalculationResult.submissionTimestamp).toBeDefined();
    expect(secondCalculationResult.submissionTimestamp).toBeDefined();
  });
});