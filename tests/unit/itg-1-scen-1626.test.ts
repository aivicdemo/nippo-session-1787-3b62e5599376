import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - Report Data Extraction', () => {
  // SCEN-1626: [error] 前週日報集約・課題分析機能 - 報告日時が null のレコードが混在するとき、処理を中止しエラーを返す
  test('should reject extraction and return error when report datetime is null', () => {
    // Arrange: テストデータを準備
    const weekStartDate = new Date('2026-08-11T00:00:00Z'); // 月曜日
    const weekEndDate = new Date('2026-08-17T23:59:59Z');   // 日曜日
    const requestedByUserId = 'manager001';
    const teamIds = ['team-dev'];

    // 報告日時がnullのレコード（異常）
    const invalidReport = {
      reportDate: null,
      userId: 'user001',
      reportContent: '昨日：タスクA完了',
      teamId: 'team-dev',
      createdAt: new Date('2026-08-12T08:00:00Z'),
    };

    // 報告日時が正常なレコード
    const validReport = {
      reportDate: new Date('2026-08-12T09:00:00Z'),
      userId: 'user002',
      reportContent: '昨日：タスクB完了',
      teamId: 'team-dev',
      createdAt: new Date('2026-08-12T09:00:00Z'),
    };

    const reports = [invalidReport, validReport];

    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds,
      requestedByUserId,
    };

    // Act & Assert
    expect(() => {
      extractWeeklyReportData(extractionRequest, reports);
    }).toThrow(/報告日時/);
  });
});