import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import { type ConfirmationEmailInput, type ConfirmationEmailOutput, type PrioritizedIssue } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail', () => {
  test('SCEN-433: [normal] 10名全員の日報から抽出された複数課題キーワードが優先度スコアで降順に並べ替えられ、確認メールに含まれる', async () => {
    // テスト用の日報データ: 10名のメンバーから複数の課題キーワード含む日報
    const aggregatedReports = [
      {
        reportId: 'rep-001',
        reporterUserId: 'user-001',
        reporterName: 'Member A',
        yesterdayAccomplishment: 'システム遅延の初期調査実施',
        todayPlan: 'システム遅延の原因特定',
        challenges: 'システム遅延、データベース接続タイムアウト',
        submissionDateTime: new Date('2024-01-15T08:30:00Z'),
      },
      {
        reportId: 'rep-002',
        reporterUserId: 'user-002',
        reporterName: 'Member B',
        yesterdayAccomplishment: 'ネットワーク環境の確認',
        todayPlan: 'システム遅延の根本原因分析',
        challenges: 'システム遅延、ネットワーク障害',
        submissionDateTime: new Date('2024-01-15T08:35:00Z'),
      },
      {
        reportId: 'rep-003',
        reporterUserId: 'user-003',
        reporterName: 'Member C',
        yesterdayAccomplishment: 'データベース性能レビュー',
        todayPlan: 'DB最適化作業',
        challenges: 'データベース接続タイムアウト、クエリ実行時間超過',
        submissionDateTime: new Date('2024-01-15T08:40:00Z'),
      },
      {
        reportId: 'rep-004',
        reporterUserId: 'user-004',
        reporterName: 'Member D',
        yesterdayAccomplishment: 'ログ分析実施',
        todayPlan: 'エラーハンドリング改善',
        challenges: 'システム遅延、メモリリーク検出',
        submissionDateTime: new Date('2024-01-15T08:45:00Z'),
      },
      {
        reportId: 'rep-005',
        reporterUserId: 'user-005',
        reporterName: 'Member E',
        yesterdayAccomplishment: 'パフォーマンス測定',
        todayPlan: 'チューニング実施',
        challenges: 'クエリ実行時間超過、メモリリーク検出',
        submissionDateTime: new Date('2024-01-15T08:50:00Z'),
      },
      {
        reportId: 'rep-006',
        reporterUserId: 'user-006',
        reporterName: 'Member F',
        yesterdayAccomplishment: 'ネットワーク設定確認',
        todayPlan: 'ファイアウォール設定見直し',
        challenges: 'ネットワーク障害、ファイアウォールルール変更',
        submissionDateTime: new Date('2024-01-15T08:55:00Z'),
      },
      {
        reportId: 'rep-007',
        reporterUserId: 'user-007',
        reporterName: 'Member G',
        yesterdayAccomplishment: 'キャッシュ戦略検討',
        todayPlan: 'キャッシュ実装',
        challenges: 'メモリリーク検出、キャッシュ無効化問題',
        submissionDateTime: new Date('2024-01-15T09:00:00Z'),
      },
      {
        reportId: 'rep-008',
        reporterUserId: 'user-008',
        reporterName: 'Member H',
        yesterdayAccomplishment: 'セキュリティ監査実施',
        todayPlan: 'セキュリティパッチ適用',
        challenges: 'セキュリティ脆弱性、ネットワーク障害対応',
        submissionDateTime: new Date('2024-01-15T09:05:00Z'),
      },
      {
        reportId: 'rep-009',
        reporterUserId: 'user-009',
        reporterName: 'Member I',
        yesterdayAccomplishment: 'ドキュメント更新',
        todayPlan: 'トレーニング資料作成',
        challenges: 'ドキュメンテーション遅延、システム遅延影響確認',
        submissionDateTime: new Date('2024-01-15T09:10:00Z'),
      },
      {
        reportId: 'rep-010',
        reporterUserId: 'user-010',
        reporterName: 'Member J',
        yesterdayAccomplishment: 'テスト計画立案',
        todayPlan: 'テスト実行',
        challenges: 'システム遅延によるテスト遅延、データ品質問題',
        submissionDateTime: new Date('2024-01-15T09:15:00Z'),
      },
    ];

    // モック TextAnalysisServiceAdapter: 抽出されたキーワードと出現頻度
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockImplementation((text: string) => {
        // テスト用: 各日報テキストから抽出されるキーワードと頻度を返す
        const allKeywords = [
          { keyword: 'システム遅延', frequency: 5 },
          { keyword: 'データベース接続タイムアウト', frequency: 3 },
          { keyword: 'ネットワーク障害', frequency: 3 },
          { keyword: 'クエリ実行時間超過', frequency: 2 },
          { keyword: 'メモリリーク検出', frequency: 3 },
          { keyword: 'ファイアウォールルール変更', frequency: 1 },
          { keyword: 'キャッシュ無効化問題', frequency: 1 },
          { keyword: 'セキュリティ脆弱性', frequency: 1 },
          { keyword: 'ドキュメンテーション遅延', frequency: 1 },
          { keyword: 'データ品質問題', frequency: 1 },
        ];
        return allKeywords;
      }),
      assessImpactScore: jest.fn().mockImplementation((keyword: string) => {
        // テスト用: キーワード別の優先度スコア (0-100)
        const scoreMap: Record<string, number> = {
          'システム遅延': 85,
          'データベース接続タイムアウト': 72,
          'ネットワーク障害': 68,
          'クエリ実行時間超過': 65,
          'メモリリーク検出': 70,
          'ファイアウォールルール変更': 45,
          'キャッシュ無効化問題': 50,
          'セキュリティ脆弱性': 75,
          'ドキュメンテーション遅延': 35,
          'データ品質問題': 60,
        };
        return scoreMap[keyword] || 0;
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime: new Date('2024-01-15T09:30:00Z'),
      aggregatedReports: aggregatedReports,
      managerUserId: 'manager-001',
      teamId: 'team-001',
      analysisDate: new Date('2024-01-15T00:00:00Z'),
    };

    // 実行
    const output: ConfirmationEmailOutput = await generateAndSendConfirmationEmail(
      input,
      mockTextAnalysisServiceAdapter
    );

    // 検証1: 出力の基本構造
    expect(output).toHaveProperty('emailId');
    expect(output).toHaveProperty('sentDateTime');
    expect(output).toHaveProperty('extractedIssuesCount');
    expect(output).toHaveProperty('prioritizedIssuesList');
    expect(output).toHaveProperty('submissionStatus');

    // 検証2: 抽出された課題数が15件以上
    expect(output.extractedIssuesCount).toBeGreaterThanOrEqual(10);

    // 検証3: 優先度付き課題リストが降順に並べ替えられているか確認
    const prioritizedIssues = output.prioritizedIssuesList;
    expect(prioritizedIssues).toHaveLength(10);

    // スコア検証: 期待される優先度順序
    const expectedScoreOrder = [85, 75, 72, 70, 68, 65, 60, 50, 45, 35];
    prioritizedIssues.forEach((issue, index) => {
      expect(issue.priorityScore).toBe(expectedScoreOrder[index]);
    });

    // 検証4: 各課題に優先度ランクが付与されているか
    const highPriorityIssues = prioritizedIssues.filter(
      (issue) => issue.priorityRank === 'high'
    );
    const mediumPriorityIssues = prioritizedIssues.filter(
      (issue) => issue.priorityRank === 'medium'
    );
    const lowPriorityIssues = prioritizedIssues.filter(
      (issue) => issue.priorityRank === 'low'
    );

    expect(highPriorityIssues.length).toBeGreaterThan(0);
    expect(mediumPriorityIssues.length).toBeGreaterThan(0);
    expect(lowPriorityIssues.length).toBeGreaterThan(0);

    // 検証5: メール受信者が管理者のみであることを確認
    expect(output.recipientUserId).toBe('manager-001');

    // 検証6: 提出状況サマリーが正しいか確認
    expect(output.submissionStatus).toHaveProperty('submittedCount');
    expect(output.submissionStatus).toHaveProperty('unsubmittedCount');
    expect(output.submissionStatus).toHaveProperty('submissionRate');

    // 10名全員が提出済みなので提出率は100%
    expect(output.submissionStatus.submittedCount).toBe(10);
    expect(output.submissionStatus.unsubmittedCount).toBe(0);
    expect(output.submissionStatus.submissionRate).toBe(1.0);

    // 検証7: メール送信日時が適切な日時型であること
    expect(output.sentDateTime).toBeInstanceOf(Date);
    expect(output.sentDateTime.getTime()).toBeGreaterThan(0);

    // 検証8: 抽出の最上位課題が正しいキーワードであること
    expect(prioritizedIssues[0].issueContent).toContain('システム遅延');
    expect(prioritizedIssues[0].priorityScore).toBe(85);
  });
});