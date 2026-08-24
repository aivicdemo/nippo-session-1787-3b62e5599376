import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';

describe('課題の影響度判定と優先度スコア順序付け表示', () => {
  // SCEN-1369: [error] 重複課題統合・優先度再計算機能 - 統合対象の課題リストが空配列のとき処理が中断される
  test('統合対象の課題リストが空配列のとき、エラーをスローする', () => {
    const emptyReportDataList: any[] = [];
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-31';

    expect(() => {
      extractAndRankIssueKeywords({
        reportDataList: emptyReportDataList,
        analysisStartDate,
        analysisEndDate,
        minFrequencyThreshold: 1,
      });
    }).toThrow(/課題リスト|統合対象|空/);
  });
});