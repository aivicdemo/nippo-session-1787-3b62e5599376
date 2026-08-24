import { describe, test, expect } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('朝会報告管理システム', () => {
  test('SCEN-2690: 前日報告内容取得機能 - 報告内容（昨日やったこと）が空文字のとき、エラーが発生する', async () => {
    const engineerId = 'ENG-2024-001';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'DEPT-HEAD-001';

    const mockYesterdayReport = {
      reportId: 'REPORT-2024-0114-001',
      engineerId: engineerId,
      reportDate: new Date('2024-01-14'),
      yesterdayAccomplishment: '',
      todayPlan: '会議資料作成',
      challenges: 'システム連携',
      submittedAt: new Date('2024-01-14T09:00:00Z'),
    };

    const input = {
      engineerId: engineerId,
      targetDate: targetDate,
      requestingUserId: requestingUserId,
    };

    expect(() => {
      fetchYesterdayReport(input, mockYesterdayReport);
    }).toThrow(/昨日やったこと/);
  });
});