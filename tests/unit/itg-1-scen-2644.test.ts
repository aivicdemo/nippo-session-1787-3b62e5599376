import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2644: [error] 初回テスト報告入力検証機能 - TextAnalysisServiceAdapter の assessImpactScore が失敗したとき、スコア算出エラーが発生する
  test('should handle assessImpactScore failure and display fallback UI with cache or manual input mode', async () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを準備し、assessImpactScore が例外をスロー
    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害', 'データベース接続'],
        frequencies: [3, 2],
      }),
      assessImpactScore: jest.fn().mockRejectedValue(
        new Error('API connection timeout')
      ),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        confidence: 0.85,
      }),
    };

    // 日報入力画面で課題キーワード「システム障害」を含む報告テキストを入力
    const dailyReportInput: SubmitDailyReportInput = {
      userId: 'engineer-001',
      teamId: 'team-a',
      yesterdayAccomplishment: 'デプロイ作業を完了しました。',
      todayPlan: 'テスト環境での検証を実行します。',
      challenges: 'システム障害が発生し、データベース接続が不安定になっています。対応が必要です。',
      reportDate: '2024-01-15',
    };

    // Act: 「送信」ボタンをクリックし、スコア算出処理を実行
    // submitDailyReport を実行すると TextAnalysisServiceAdapter.assessImpactScore が呼ばれ、例外が発生する
    const result = await submitDailyReport(
      dailyReportInput,
      stubTextAnalysisServiceAdapter
    );

    // Assert: システムがスコア算出エラーをキャッチし、フォールバック処理を実行
    expect(result).toBeDefined();
    expect(result.reportId).toBeTruthy();
    expect(result.submissionTimestamp).toBeTruthy();
    
    // ユーザー向けダッシュボードに表示するメッセージが含まれている
    expect(result.fallbackMessage).toBe('課題分析が一時的に利用できません。手動入力をご利用ください');
    
    // 手動キーワード入力モードに自動切り替わったことを示すフラグ
    expect(result.isManualKeywordInputMode).toBe(true);
    
    // 日報入力は中断されず、送信可能な状態
    expect(result.isWithinDeadline).toBeDefined();
    
    // TextAnalysisServiceAdapter.assessImpactScore が呼ばれたことを確認
    expect(stubTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
  });
});