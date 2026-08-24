import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 初回テスト報告の入力検証', () => {
  // SCEN-2508: [normal] 初回テスト報告の入力検証機能 - 入力テキストが品質基準（最小文字数未満）を下回る場合に修正指示が返される
  test('最小文字数未満の「昨日やったこと」を入力した場合、修正指示が返されて送信が実行されない', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      yesterdayAccomplishment: 'テスト済み',
      todayPlan: 'デバッグとコードレビューを実施して品質を確保する',
      challenges: '複雑な仕様の理解に時間がかかっているため進捗が遅延している',
      submissionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: 'yesterdayAccomplishment',
          errorCode: 'ExceedsCharacterLimit',
          message: expect.stringMatching(/昨日やったこと.*10文字/),
        }),
      ])
    );
    expect(result.reportId).toBeUndefined();
    expect(result.submissionTimestamp).toBeUndefined();
    expect(result.isWithinDeadline).toBeUndefined();
  });
});