import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-management';
import type {
  SubmitDailyReportInput,
  SubmitDailyReportOutput,
} from '../../src/logic/daily-report-management';

describe('submitDailyReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2544: [edge] 初回テスト報告の入力検証機能 - 報告者ユーザーと所属チームの関連付けが存在する場合、関連付け検証が合格となる
  test('should accept daily report submission when user-team association exists', async () => {
    const submission_timestamp = new Date('2024-01-15T09:30:00Z');
    const report_date = '2024-01-15';
    const user_id = 'U001';
    const team_id = 'T001';
    const yesterday_accomplishment = 'ドキュメント作成';
    const today_plan = 'レビュー実施';
    const challenges = '納期調整が必要';

    const input: SubmitDailyReportInput = {
      userId: user_id,
      teamId: team_id,
      yesterdayAccomplishment: yesterday_accomplishment,
      todayPlan: today_plan,
      challenges: challenges,
      reportDate: report_date,
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(input);

    expect(result).toMatchObject({
      reportId: expect.any(String),
      submissionTimestamp: expect.any(String),
      isWithinDeadline: expect.any(Boolean),
    });

    expect(result.submissionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});