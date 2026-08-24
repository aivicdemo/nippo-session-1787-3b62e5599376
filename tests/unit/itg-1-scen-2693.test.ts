import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('朝会報告管理システム - 前日報告内容取得機能', () => {
  // SCEN-2693
  test('報告内容（抱えている課題）が null のとき、エラーが発生する', async () => {
    const engineerId = 'ENG-001';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'MGR-001';

    // モックデータベースから返す前日報告レコード
    // 『抱えている課題』フィールドを null で設定
    const yesterdayReportFromDb = {
      reportId: 'RPT-2024-01-14-001',
      engineerId: engineerId,
      reportDate: new Date('2024-01-14'),
      yesterdayAccomplishment: 'API開発を完了した',
      todayPlan: 'データベーススキーマ設計を開始',
      challenges: null, // 【重要】抱えている課題が null
      submittedAt: new Date('2024-01-14T08:30:00Z'),
    };

    // TextAnalysisServiceAdapter のスタブを作成
    // extractKeywords メソッドが null を受け取った場合の振る舞いを定義
    const textAnalysisServiceStub = {
      extractKeywords: jest.fn().mockImplementation((text: string | null) => {
        if (text === null) {
          throw new Error('課題情報が不足しています');
        }
        return {
          keywords: ['API', '開発'],
          frequency: [2, 1],
        };
      }),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    // モックデータベース取得関数
    const mockDbGetReport = jest.fn().mockResolvedValue(yesterdayReportFromDb);

    // 前日報告内容取得関数を呼び出す
    // 戻り値またはスローされた例外をキャッチする
    let capturedError: Error | null = null;
    let resultFromFunction: any = null;

    try {
      resultFromFunction = await fetchYesterdayReport(
        { engineerId, targetDate, requestingUserId },
        textAnalysisServiceStub,
        mockDbGetReport,
      );
    } catch (err) {
      capturedError = err as Error;
    }

    // 期待結果: 関数がエラーをスロー、または戻り値にエラーフラグが立つ
    // いずれかの方式で検証
    const hasError = capturedError !== null || (resultFromFunction && resultFromFunction.error);

    expect(hasError).toBe(true);

    // エラーメッセージに『課題情報が不足しています』が含まれることを確認
    const errorMessage = capturedError
      ? capturedError.message
      : resultFromFunction?.errorMessage || '';

    expect(errorMessage).toMatch(/課題情報が不足しています|抱えている課題がnullです/);

    // TextAnalysisServiceAdapter の extractKeywords が null で呼ばれたことを確認
    expect(textAnalysisServiceStub.extractKeywords).toHaveBeenCalledWith(null);
  });
});