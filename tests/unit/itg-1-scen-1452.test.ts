import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest } from '../../src/logic/weekly-issue-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1452: [error] 前週日報データ集約機能 - チームメンバー一覧が空配列の場合にエラーになる
  test('チームメンバー一覧が空配列の場合、メンバーリストが空ですというエラーメッセージを含むErrorをスローする', () => {
    const emptyTeamIds: string[] = [];
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const requestedByUserId = 'user-001';

    const request: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds: emptyTeamIds,
      requestedByUserId,
    };

    expect(() => {
      extractWeeklyReportData(request);
    }).toThrow(/メンバーリストが空/);
  });
});