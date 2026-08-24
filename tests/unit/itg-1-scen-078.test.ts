import { describe, test, expect } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submit Daily Report', () => {
  // SCEN-078: [error] 日報送信期限判定機能 - 入力された日報項目が 3 項目未満のとき処理が進まずエラーを返す
  test('should reject submission when fewer than 3 required fields are provided', async () => {
    const incompleteInput: Omit<SubmitDailyReportInput, 'challenges'> & { challenges?: string } = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API integration testing',
      todayPlan: 'Will review pull requests and update documentation',
      challenges: undefined,
      reportDate: '2024-01-15',
    };

    const inputWithTwoFields: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API integration testing',
      todayPlan: 'Will review pull requests and update documentation',
      challenges: '',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(inputWithTwoFields)).toThrow(/3項目/);
  });
});