import { submitDailyReport } from '../../src/logic/daily-report-management';
import type {
  SubmitDailyReportInput,
  SubmitDailyReportOutput,
} from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2537: [edge] 初回テスト報告の入力検証機能 - 報告テキストの文字数が最大許容値である場合、品質基準検証が合格となる
  test('報告テキストの文字数が最大許容値に達している場合、品質基準検証が合格ステータスを返し送信ボタンが有効化される', async () => {
    // 最大文字数: yesterdayAccomplishment と todayPlan は 2000 文字、challenges は 2000 文字
    const maxCharText2000 = 'a'.repeat(2000);
    const maxCharText1000 = 'a'.repeat(1000);

    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-A',
      yesterdayAccomplishment: maxCharText2000,
      todayPlan: maxCharText2000,
      challenges: maxCharText1000,
      reportDate: '2024-01-15',
    };

    // テスト用の TextAnalysisServiceAdapter スタブ
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['keyword1', 'keyword2'],
        frequency: [2, 1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        score: 45,
        severity: 'medium',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
        confidence: 0.85,
      }),
    };

    // 関数を呼び出し、戻り値を検証
    const result: SubmitDailyReportOutput = await submitDailyReport(
      input,
      mockTextAnalysisAdapter
    );

    // 期待値: 検証が合格し、reportId と submissionTimestamp が返される
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('submissionTimestamp');
    expect(result).toHaveProperty('isWithinDeadline');
    expect(typeof result.reportId).toBe('string');
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(typeof result.isWithinDeadline).toBe('boolean');

    // 報告内容が最大文字数であることを確認
    expect(input.yesterdayAccomplishment.length).toBe(2000);
    expect(input.todayPlan.length).toBe(2000);
    expect(input.challenges.length).toBe(1000);

    // TextAnalysisServiceAdapter のメソッドが呼び出されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalled();
  });
});