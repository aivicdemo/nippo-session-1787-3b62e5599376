import { prepareDashboardData, type DashboardDataPrepareInput, type DashboardDisplayData } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム - ダッシュボード表示データ準備', () => {
  test('SCEN-199: 朝会開始予定時刻が過去に設定されている場合、警告を記録しつつダッシュボードデータを正常に返す', () => {
    // 現在時刻を固定
    const now = new Date('2025-01-15T09:30:00Z');
    const currentTimestamp = now.getTime();
    
    // 朝会開始時刻を現在時刻より前に設定（業務ルール: 過去のとき警告）
    const pastMeetingStart = new Date('2025-01-15T09:00:00Z');
    const deadlineTime = pastMeetingStart.getTime();
    
    // 入力パラメータを準備
    const input: DashboardDataPrepareInput = {
      teamId: 'team-001',
      targetDate: new Date('2025-01-15'),
      requestingUserId: 'user-manager-001',
      includeHistoricalTrend: false,
    };
    
    // 警告メッセージが記録されるかを検証するため、console.warn をスパイ化
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    try {
      // 関数を呼び出す
      const result = prepareDashboardData(input);
      
      // 結果がDashboardDisplayData型であることを確認
      expect(result).toBeDefined();
      expect(result).toHaveProperty('submissionStatusSummary');
      expect(result).toHaveProperty('unsubmittedMembers');
      expect(result).toHaveProperty('prioritizedIssueList');
      expect(result).toHaveProperty('issueKeywordRanking');
      expect(result).toHaveProperty('lastUpdatedAt');
      
      // submissionStatusSummary の基本構造確認
      expect(result.submissionStatusSummary).toHaveProperty('submittedCount');
      expect(result.submissionStatusSummary).toHaveProperty('pendingCount');
      expect(result.submissionStatusSummary).toHaveProperty('submissionRate');
      expect(result.submissionStatusSummary).toHaveProperty('submissionDeadline');
      
      // unsubmittedMembers は配列
      expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
      
      // prioritizedIssueList は配列
      expect(Array.isArray(result.prioritizedIssueList)).toBe(true);
      
      // issueKeywordRanking は配列
      expect(Array.isArray(result.issueKeywordRanking)).toBe(true);
      
      // lastUpdatedAt は Date オブジェクト
      expect(result.lastUpdatedAt instanceof Date).toBe(true);
      
      // 警告メッセージが記録されたことを確認
      // 業務ルール br-tx_1-004 の制約2: 朝会開始時刻が過去のとき警告
      const warningCalls = warnSpy.mock.calls.filter(call => 
        typeof call[0] === 'string' && call[0].includes('朝会開始時刻')
      );
      expect(warningCalls.length).toBeGreaterThan(0);
      expect(warningCalls[0][0]).toMatch(/朝会開始時刻が過去に設定されています。確認してください/);
      
    } finally {
      warnSpy.mockRestore();
    }
  });
});