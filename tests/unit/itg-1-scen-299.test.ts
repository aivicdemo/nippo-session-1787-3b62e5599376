import { submitReport } from '../../src/logic/report-submission-management';

jest.mock('../../src/logic/input-validation-and-formatting');
jest.mock('../../src/logic/report-persistence');

describe('朝会報告管理システム - 日報送信', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('SCEN-299: エンジニアが日報を送信し、今日やることが500文字を超えるときエラーが発生する', () => {
    const reporterIdInput = 'engineer-001';
    const teamIdInput = 'team-A';
    const reportDateInput = new Date('2025-01-15T00:00:00Z');
    const yesterdayAccomplishmentInput = 'テスト実施完了';
    const todayPlanInput = 'あ'.repeat(501);
    const issuesAndConcernsInput = 'API仕様確認中';

    expect(() =>
      submitReport(
        reporterIdInput,
        teamIdInput,
        reportDateInput,
        yesterdayAccomplishmentInput,
        todayPlanInput,
        issuesAndConcernsInput
      )
    ).toThrow(/今日やることは500文字以内で入力してください/);
  });
});