import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2472: [normal] 操作習熟度スコア計算機能 - 初回ログインから報告送信まで全操作を完了したとき、習熟度スコアが0～100の数値で計算される
  test('初回ユーザーが日報入力フォームから報告を送信したとき、習熟度スコア(0～100)が計算され返される', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['タスク完了', '課題内容'],
        frequency: { 'タスク完了': 1, '課題内容': 1 }
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 65
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium'
      })
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'delivered'
      })
    };

    const reportInput: SubmitDailyReportInput = {
      userId: 'user-initial-001',
      teamId: 'team-dev-001',
      yesterdayAccomplishment: '前日のタスク完了',
      todayPlan: '本日のタスク予定',
      challenges: '現在の課題内容',
      reportDate: '2024-01-15'
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(
      reportInput,
      mockTextAnalysisServiceAdapter,
      mockNotificationServiceAdapter
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');
    const submissionTime = new Date(result.submissionTimestamp);
    expect(submissionTime.getTime()).toBeGreaterThan(0);

    expect(typeof result.isWithinDeadline).toBe('boolean');
    expect(result.isWithinDeadline).toBe(true);

    expect(result.habitualityScore).toBeDefined();
    expect(typeof result.habitualityScore).toBe('number');
    expect(result.habitualityScore).toBeGreaterThanOrEqual(0);
    expect(result.habitualityScore).toBeLessThanOrEqual(100);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.stringContaining('前日のタスク完了')
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();
  });
});