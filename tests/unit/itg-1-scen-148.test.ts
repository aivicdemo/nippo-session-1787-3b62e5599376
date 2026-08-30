import { saveReport } from '../../src/logic/report-persistence';

describe('朝会報告管理システム - 日報永続化', () => {
  test('SCEN-148: 日報データの暗号化処理に失敗した場合、EncryptionFailureErrorが発火し、適切なエラーメッセージが返される', () => {
    const inputData = {
      reporterId: 'ENG001',
      teamId: 'TEAM-A',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: 'タスク完了',
      todayPlan: '新規開発',
      issuesAndConcerns: 'リソース不足',
      attachmentUrls: [],
    };

    const expectedErrorMessage = '日報データの暗号化に失敗しました。システム管理者に連絡してください。';

    expect(() => {
      saveReport(inputData);
    }).toThrow(expectedErrorMessage);
  });
});