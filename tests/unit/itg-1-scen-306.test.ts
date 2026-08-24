import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  test('SCEN-306: 3つの必須項目すべてが入力ルールを満たしているとき送信処理に進む', async () => {
    // Arrange: 有効な日報入力データを準備
    const validSubmissionInput = {
      userId: 'test-user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'APIの認証機能を実装した。',
      todayPlan: 'APIの承認フローを実装する。',
      challenges: 'データベース接続がタイムアウトしている。',
      reportDate: '2024-01-15',
    };

    // Act: 日報送信関数を実行
    const result = await submitDailyReport(validSubmissionInput);

    // Assert: 送信処理が正常に完了し、期待値が返されることを検証
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
    
    // 送信時刻が ISO 8601 形式であることを検証
    expect(result.submissionTimestamp).toBeDefined();
    const submissionDate = new Date(result.submissionTimestamp);
    expect(submissionDate.getTime()).toBeGreaterThan(0);
    
    // 送信が期限内であることを検証
    expect(result.isWithinDeadline).toBe(true);
  });
});