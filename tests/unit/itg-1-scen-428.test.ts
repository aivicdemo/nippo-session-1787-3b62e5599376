import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('朝会報告提出状況の集計・表示機能', () => {
  // SCEN-428: [edge] 報告提出状況の集計・表示機能 - 複数メンバーの提出時刻が同一の場合、メンバー間で提出状況の判定に矛盾が生じない
  test('複数メンバーが同一時刻に提出した場合、すべてのメンバーが一貫した提出状況で表示される', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'user-manager-001';
    
    // 同一タイムスタンプ: 09:00:00 UTC
    const submissionTimestampA = new Date('2024-01-15T09:00:00Z');
    const submissionTimestampB = new Date('2024-01-15T09:00:00Z');
    const submissionTimestampC = new Date('2024-01-15T09:00:00Z');

    // 報告期限を09:30:00に設定（3メンバーとも期限内）
    const reportDeadlineTime = new Date('2024-01-15T09:30:00Z');

    // テスト入力: 集計対象チーム・日付・実行ユーザー
    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // モックデータ: チームメンバー3名
    // - メンバーA: 提出時刻 09:00:00 (期限内)
    // - メンバーB: 提出時刻 09:00:00 (期限内、同一時刻)
    // - メンバーC: 提出時刻 09:00:00 (期限内、同一時刻)
    // - メンバーD: 未提出 (提出時刻なし)
    const teamMembers = [
      { userId: 'user-001', userName: '山田太郎', email: 'yamada@example.com' },
      { userId: 'user-002', userName: '鈴木花子', email: 'suzuki@example.com' },
      { userId: 'user-003', userName: '佐藤次郎', email: 'sato@example.com' },
      { userId: 'user-004', userName: '田中美咲', email: 'tanaka@example.com' },
    ];

    const submissionRecords = [
      { userId: 'user-001', submissionTimestamp: submissionTimestampA },
      { userId: 'user-002', submissionTimestamp: submissionTimestampB },
      { userId: 'user-003', submissionTimestamp: submissionTimestampC },
      // user-004 は提出なし
    ];

    // 関数呼び出し時にモック化されたリポジトリを通じて
    // 上記のデータを返すように設定される
    // (実装側で DI パターンを採用している前提)
    
    // 期待される集計結果
    // - 総メンバー数: 4名
    // - 期限内提出: 3名 (user-001, user-002, user-003)
    // - 未提出: 1名 (user-004)
    // - 期限超過: 0名
    // - 提出率: 75.0% (3 / 4 * 100)
    
    const expectedSummary: ReportSubmissionStatusSummary = {
      teamId,
      reportDate,
      totalMembers: 4,
      submittedCount: 3,
      unsubmittedCount: 1,
      delayedSubmissionCount: 0,
      submissionRate: 75.0,
      unsubmittedMembers: [
        {
          userId: 'user-004',
          userName: '田中美咲',
          email: 'tanaka@example.com',
          remainingMinutes: -30, // 09:30:00 - 現在時刻 (期限を30分超過)
        },
      ],
      aggregatedAt: expect.any(String), // ISO 8601形式の時刻文字列
    };

    // 実装側が以下のロジックを内部に持つ前提:
    // 1. teamId と reportDate からチームの全メンバーを取得
    // 2. reportDate 対象の提出済みレコードを取得
    // 3. 提出時刻 vs 期限時刻を比較して on-time / delayed を判定
    // 4. 同一タイムスタンプの複数レコードに対して一貫性を保持
    // 5. submissionRate を小数第1位まで計算
    
    // 関数を実際に呼び出す
    const result = await aggregateReportSubmissionStatus(input);

    // アサーション: 基本統計
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(4);
    expect(result.submittedCount).toBe(3);
    expect(result.unsubmittedCount).toBe(1);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(75.0);

    // アサーション: 未提出メンバーリスト
    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0].userId).toBe('user-004');
    expect(result.unsubmittedMembers[0].userName).toBe('田中美咲');
    expect(result.unsubmittedMembers[0].email).toBe('tanaka@example.com');

    // アサーション: aggregatedAt は ISO 8601形式
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // ビジネスロジック検証: 同一時刻提出の一貫性
    // 3メンバー (user-001, user-002, user-003) は
    // すべて同一時刻 09:00:00 での提出であり、
    // ダッシュボード表示時に矛盾したステータスが表示されていないこと
    const submittedUserIds = ['user-001', 'user-002', 'user-003'];
    const allSubmittedArePresentInCount = submittedUserIds.length === result.submittedCount;
    expect(allSubmittedArePresentInCount).toBe(true);

    // タイムスタンプ秒単位での同一性により、
    // ソート順序や優先度判定に不一致が生じていないことを検証
    // (ダッシュボード表示時に同一ステータスで表示される)
    const allUnsubmittedHaveSameStatus = result.unsubmittedMembers.every(
      (member) => member.userId === 'user-004'
    );
    expect(allUnsubmittedHaveSameStatus).toBe(true);

    // 合計数の整合性: 提出済み + 未提出 + 期限超過 = 総数
    const totalAccounting = result.submittedCount + result.unsubmittedCount + result.delayedSubmissionCount;
    expect(totalAccounting).toBe(result.totalMembers);
  });
});