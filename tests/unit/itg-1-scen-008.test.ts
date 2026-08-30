import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('朝会報告管理システム - Tx2Imp1Agent', () => {
  // SCEN-008: 部長への確認メール送信に失敗した場合のエラーハンドリング
  test('部長向け確認メール送信失敗時はexecutionStatusがpartial_failureとなり、managerEmailSentがfalseになる', async () => {
    // Setup: 入力値の準備
    const executionDate = new Date('2024-01-15T09:00:00Z');
    const teamIds = undefined; // 全チーム対象
    const managerNotificationEnabled = true;

    // Setup: スタブ化されたAIクライアント
    // generateAndSendManagerConfirmationEmailがエラーを発生させるよう設定
    const mockAiClient = {
      aggregateDailyReportsFromDatabase: async () => ({
        submittedReportCount: 8,
        reportDataList: [
          {
            employeeId: 'emp001',
            employeeName: '太郎',
            yesterday: '昨日のタスク完了',
            today: '本日のタスク予定',
            issue: 'ビルド失敗',
            submittedAt: '2024-01-15T08:30:00Z',
          },
          {
            employeeId: 'emp002',
            employeeName: '花子',
            yesterday: '前日のコード修正',
            today: '今日のレビュー対応',
            issue: 'テスト失敗',
            submittedAt: '2024-01-15T08:45:00Z',
          },
          {
            employeeId: 'emp003',
            employeeName: '次郎',
            yesterday: 'DB最適化実施',
            today: 'パフォーマンス検証',
            issue: 'リソース不足',
            submittedAt: '2024-01-15T09:00:00Z',
          },
          {
            employeeId: 'emp004',
            employeeName: '由美',
            yesterday: 'デプロイ完了',
            today: 'ホットフィックス対応',
            issue: 'ビルド失敗',
            submittedAt: '2024-01-15T08:50:00Z',
          },
          {
            employeeId: 'emp005',
            employeeName: '健太',
            yesterday: 'ドキュメント作成',
            today: 'API設計レビュー',
            issue: 'ビルド失敗',
            submittedAt: '2024-01-15T08:55:00Z',
          },
          {
            employeeId: 'emp006',
            employeeName: '美咲',
            yesterday: 'UI修正完了',
            today: 'フロントエンドテスト',
            issue: 'テスト失敗',
            submittedAt: '2024-01-15T08:40:00Z',
          },
          {
            employeeId: 'emp007',
            employeeName: '拓也',
            yesterday: 'インフラ構築',
            today: 'セキュリティ監査',
            issue: 'リソース不足',
            submittedAt: '2024-01-15T08:35:00Z',
          },
          {
            employeeId: 'emp008',
            employeeName: '麗子',
            yesterday: 'テスト実行',
            today: 'バグ修正',
            issue: 'ビルド失敗',
            submittedAt: '2024-01-15T08:25:00Z',
          },
        ],
        allTeamMembers: [
          { employeeId: 'emp001', employeeName: '太郎' },
          { employeeId: 'emp002', employeeName: '花子' },
          { employeeId: 'emp003', employeeName: '次郎' },
          { employeeId: 'emp004', employeeName: '由美' },
          { employeeId: 'emp005', employeeName: '健太' },
          { employeeId: 'emp006', employeeName: '美咲' },
          { employeeId: 'emp007', employeeName: '拓也' },
          { employeeId: 'emp008', employeeName: '麗子' },
          { employeeId: 'emp009', employeeName: '翔太' },
          { employeeId: 'emp010', employeeName: '由紀' },
        ],
      }),
      extractIssueKeywordsFromReports: async () => ({
        extractedKeywords: [
          { keyword: 'ビルド失敗', frequency: 4, rank: 1 },
          { keyword: 'テスト失敗', frequency: 2, rank: 2 },
          { keyword: 'リソース不足', frequency: 2, rank: 3 },
        ],
      }),
      calculateIssuePriorityScores: async () => ({
        prioritizedIssues: [
          { keyword: 'ビルド失敗', frequency: 4, priorityScore: 72, priorityLevel: 'high' },
          { keyword: 'テスト失敗', frequency: 2, priorityScore: 48, priorityLevel: 'medium' },
          { keyword: 'リソース不足', frequency: 2, priorityScore: 45, priorityLevel: 'medium' },
        ],
      }),
      generateAndSendManagerConfirmationEmail: async () => {
        throw new Error('部長への確認メール送信に失敗しました。再度実行してください。');
      },
    };

    // Execute: runTx2Imp1Agentを呼び出す
    const result = await runTx2Imp1Agent(
      {
        executionDate,
        teamIds,
        managerNotificationEnabled,
      },
      mockAiClient as any
    );

    // Verify: 出力値を検証
    expect(result.executionStatus).toBe('partial_failure');
    expect(result.managerEmailSent).toBe(false);
    expect(result.extractedIssuesCount).toBe(3);
    expect(result.prioritizedIssuesList).toEqual([
      { keyword: 'ビルド失敗', frequency: 4, priorityScore: 72, priorityLevel: 'high' },
      { keyword: 'テスト失敗', frequency: 2, priorityScore: 48, priorityLevel: 'medium' },
      { keyword: 'リソース不足', frequency: 2, priorityScore: 45, priorityLevel: 'medium' },
    ]);
    expect(result.processingTimestampUtc).toBeInstanceOf(Date);
  });
});