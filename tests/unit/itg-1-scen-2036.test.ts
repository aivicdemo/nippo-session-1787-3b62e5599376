import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信処理', () => {
  // SCEN-2036: [error] 対策案・実行計画の必須項目検証 - 実行予算額が空のとき検証エラーになる
  test('should reject submission when executionBudget is missing in mitigation plan', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: 'リソース不足',
      reportDate: '2024-01-15',
      mitigationPlan: {
        proposedMeasure: '追加リソース配置',
        executionBudget: '',
        expectedOutcome: '生産性向上',
        responsiblePerson: 'manager-001',
        deadline: '2024-01-20'
      }
    };

    expect(() => submitDailyReport(input)).toThrow(/実行予算額/);
  });
});