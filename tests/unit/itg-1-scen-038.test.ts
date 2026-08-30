import { submitReport } from '../../src/logic/report-submission-management';
import type { SubmitReportInput, SubmitReportOutput, ValidationErrorDetail } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-038: 3項目のいずれかが空白の場合、該当項目を赤く表示してエラーを返す
  test('should return validation error when yesterdayAccomplishment is empty', async () => {
    const input: SubmitReportInput = {
      reporterId: 'ENG001',
      teamId: 'TEAM-A',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: '',
      todayPlan: '今日の予定テキスト',
      issuesAndConcerns: '課題テキスト',
    };

    const expectedErrorMessage = '昨日の実績が空白である';
    const expectedFieldName = 'yesterdayAccomplishment';
    const expectedErrorType = 'empty';

    expect(() => submitReport(input)).toThrow(
      new RegExp(expectedErrorMessage)
    );
  });
});