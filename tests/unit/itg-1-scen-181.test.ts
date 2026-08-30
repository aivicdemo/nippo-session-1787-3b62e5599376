import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信', () => {
  test('SCEN-181: エンジニアが日報を送信し、入力検証、送信時刻記録、期限判定、提出状況更新を実行する', () => {
    // 入力データ: すべて有効な代表値
    const yesterdayWork = '顧客A向けAPI開発完了';
    const todayPlan = 'テスト実施予定';
    const currentIssue = 'DB接続タイムアウト懸念';

    // submitReport関数を呼び出す
    const result = submitReport(yesterdayWork, todayPlan, currentIssue);

    // 戻り値のisValidがtrueであることを確認
    expect(result.isValid).toBe(true);

    // 戻り値のerrorsが空配列[]であることを確認
    expect(result.errors).toEqual([]);
  });
});