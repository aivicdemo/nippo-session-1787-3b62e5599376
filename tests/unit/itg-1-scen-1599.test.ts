import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成 - 課題ランキング順序検証', () => {
  // SCEN-1599
  test('課題ランキングが昇順（優先度低→高）で逆順に並んでいる場合、エラーまたは警告が発生すること', () => {
    // テストデータ準備：優先度スコア降順の正規課題リスト
    const extractedIssuesWithNormalOrder = [
      {
        keyword: '課題A',
        occurrenceCount: 5,
        impactScore: 95,
      },
      {
        keyword: '課題B',
        occurrenceCount: 4,
        impactScore: 75,
      },
      {
        keyword: '課題C',
        occurrenceCount: 3,
        impactScore: 50,
      },
      {
        keyword: '課題D',
        occurrenceCount: 2,
        impactScore: 30,
      },
    ];

    // 昇順（逆順）に並んだ異常データ
    const extractedIssuesWithReverseOrder = [
      {
        keyword: '課題D',
        occurrenceCount: 2,
        impactScore: 30,
      },
      {
        keyword: '課題C',
        occurrenceCount: 3,
        impactScore: 50,
      },
      {
        keyword: '課題B',
        occurrenceCount: 4,
        impactScore: 75,
      },
      {
        keyword: '課題A',
        occurrenceCount: 5,
        impactScore: 95,
      },
    ];

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const inputData = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: extractedIssuesWithReverseOrder,
      teamId: 'team-001',
    };

    // レポート生成処理を実行
    const throwingFn = () => {
      generateWeeklyAnalysisReport(inputData);
    };

    // エラーハンドリング動作を確認
    // パターン(3)：例外がスローされ、error.message に『ランキング順序検証エラー』を含む場合
    try {
      throwingFn();
      // エラーがスローされない場合、パターン(1)または(2)の確認
      if (consoleErrorSpy.mock.calls.length > 0) {
        const errorOutput = consoleErrorSpy.mock.calls[0][0];
        expect(errorOutput).toMatch(/課題ランキング|順序異常|降順/);
      } else {
        // パターン(2)：生成が成功してもランキング順序が検証される
        fail('期待されるエラーハンドリングが実行されませんでした');
      }
    } catch (error) {
      // パターン(3)：例外がスロー
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/ランキング順序検証エラー|課題ランキング/);
    }

    consoleErrorSpy.mockRestore();
  });
});