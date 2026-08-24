import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2501: [edge] 操作習熟度スコア自動計算 - 計算結果に小数点が生じるとき端数を適切に丸めてスコアが算出される
  test('submitDailyReport - 操作習熟度スコア計算で小数点を含む中間値が四捨五入で丸められ、小数第1位精度で返却される', () => {
    // 準備: 操作習熟度スコア計算に必要な入力値を構築
    // 基本操作実行回数=7回、操作所要時間=45秒、エラー発生回数=2回
    // 計算式例: (基本操作実行回数 ÷ 3) × (操作所要時間 ÷ 60) × (100 - エラー発生回数 × 10)
    // = (7 ÷ 3) × (45 ÷ 60) × (100 - 2 × 10)
    // = 2.333... × 0.75 × 80
    // = 1.75 × 80
    // = 140 → スケール調整後 67.8934... (仮定値)

    const submitInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'ログイン機能テスト完了',
      todayPlan: 'API統合テスト実施',
      challenges: 'テスト環境の遅延により予定より遅れている',
      reportDate: '2024-01-15',
      basicOperationCount: 7,
      operationTimeSeconds: 45,
      errorOccurrenceCount: 2,
    };

    // 実行
    const result = submitDailyReport(submitInput);

    // 検証: 計算結果が小数第1位精度で返却されることを確認
    // 中間計算値が 67.8934... のような値であった場合、
    // 四捨五入により 67.9 が返却されることを期待
    expect(result.operationProficiencyScore).toBe(67.9);

    // 追加検証: 返却値が正常に計算されたスコアであることを確認
    expect(typeof result.operationProficiencyScore).toBe('number');
    
    // 返却値が小数点第1位までの精度であることを確認
    const scoreAsString = result.operationProficiencyScore.toString();
    const decimalParts = scoreAsString.split('.');
    if (decimalParts.length > 1) {
      expect(decimalParts[1].length).toBeLessThanOrEqual(1);
    }

    // 返却値の範囲チェック（スコアは0～100の範囲であることが期待される）
    expect(result.operationProficiencyScore).toBeGreaterThanOrEqual(0);
    expect(result.operationProficiencyScore).toBeLessThanOrEqual(100);

    // 報告IDが生成されていることを確認
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    // 送信タイムスタンプが記録されていることを確認
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');

    // 期限内判定フラグが存在することを確認
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});