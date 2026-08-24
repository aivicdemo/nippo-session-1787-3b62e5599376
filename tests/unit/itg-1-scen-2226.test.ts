import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2226: [edge] 朝会報告の入力値検証機能 - 複数の報告項目が形式要件を満たさない場合、すべての不合格項目に個別のエラーメッセージが表示される
  test('複数項目の検証エラーが同時にすべて返却される', () => {
    const yesterdayAccomplishment = '';
    const todayPlan = 'a'.repeat(5001);
    const challenges = '!@#$%';
    const userId = 'user-001';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';

    const result = submitDailyReport({
      userId,
      teamId,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      reportDate,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors?.length).toBe(3);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/昨日やったこと.*必須/),
        expect.stringMatching(/今日やること.*文字/),
        expect.stringMatching(/抱えている課題.*形式/),
      ])
    );
  });
});