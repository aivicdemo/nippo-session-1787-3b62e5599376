import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1460
  test('前週日報データ集約機能 - 集約リクエストを実行したユーザーが開発部長ロールではない場合にエラーになる', () => {
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const generalMemberUserId = 'user-general-001';

    const requestByGeneralMember: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds: ['team-dev-001'],
      requestedByUserId: generalMemberUserId,
    };

    expect(() => {
      extractWeeklyReportData(requestByGeneralMember);
    }).toThrow(/開発部長ロール|権限|Unauthorized/i);
  });
});