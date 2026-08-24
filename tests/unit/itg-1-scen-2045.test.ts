import { describe, test, expect, beforeEach } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

const fetchMock = require('jest-fetch-mock');

describe('submitDailyReport - 対策案タイトルの不正形式検証', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-2045
  test('対策案タイトルとして不正な形式の文字列が入力されたとき検証エラーが返される', async () => {
    const invalidTitles = [
      '',
      '\n\n',
      '\t\t',
      '\x00\x01',
      "<script>alert('test')</script>",
      "'; DROP TABLE --"
    ];

    for (const invalidTitle of invalidTitles) {
      fetchMock.resetMocks();

      const input: SubmitDailyReportInput = {
        userId: 'user-001',
        teamId: 'team-001',
        yesterdayAccomplishment: 'Completed API implementation',
        todayPlan: 'Testing and deployment',
        challenges: 'Database performance issue',
        reportDate: '2024-01-15'
      };

      fetchMock.mockResponseOnce(
        JSON.stringify({
          statusCode: 400,
          message: '対策案タイトルは1文字以上100文字以下の英数字・ハイフン・アンダースコアのみ許可されます',
          fieldName: 'countermeasureTitleError',
          errorCode: 'INVALID_COUNTERMEASURE_TITLE_FORMAT'
        }),
        { status: 400 }
      );

      await expect(submitDailyReport(input)).rejects.toThrow(/対策案タイトル/);
    }
  });
});