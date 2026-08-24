import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2491: [error] 操作習熟度スコア計算機能 - 操作ステップ内の必須項目（タイムスタンプ）が欠落しているとき、エラーを返す
  test('submitDailyReport should return error when operation step is missing required timestamp field', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '前日の実績として、APIの統合テストを完了した',
      todayPlan: '本日の予定として、デプロイメント準備とドキュメント作成を実施する',
      challenges: '抱えている課題として、レスポンスタイムの最適化が必要',
      reportDate: '2024-01-15',
      operationSteps: [
        {
          operationId: 'op-001',
          userId: 'user-001',
          // timestamp フィールドを意図的に削除
          actionType: 'form_input',
          fieldName: 'yesterdayAccomplishment',
        },
        {
          operationId: 'op-002',
          userId: 'user-001',
          timestamp: '2024-01-15T09:15:30Z',
          actionType: 'form_input',
          fieldName: 'todayPlan',
        },
      ],
    };

    expect(() => submitDailyReport(input)).toThrow(/タイムスタンプ/);
  });
});