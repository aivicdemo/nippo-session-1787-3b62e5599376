import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('日報収集から分析レポート生成までの自動実行 AIエージェント', () => {
  // SCEN-3166: [normal] 日報収集から分析レポート生成までの自動実行 AIエージェント
  // 「日報収集から分析レポート生成までの自動実行」が自律処理「課題の発生頻度、カテゴリ別の傾向を分析する」を契約どおり実行する
  test('should execute action-04 trend analysis with keyword frequency and categorized issues', async () => {
    // テスト用の前週日報データセット（5営業日分、10名メンバー）
    const mockReportDataSet = [
      {
        reportId: 'report-001',
        reportDate: '2024-01-08',
        memberId: 'member-001',
        issueDescription: 'システムダウンが発生してしまいました。復旧に30分要しました。',
      },
      {
        reportId: 'report-002',
        reportDate: '2024-01-08',
        memberId: 'member-002',
        issueDescription: 'デプロイエラーが発生。ロールバック対応が必要でした。',
      },
      {
        reportId: 'report-003',
        reportDate: '2024-01-08',
        memberId: 'member-003',
        issueDescription: '顧客対応遅延のため急遽対応。進捗に影響がありました。',
      },
      {
        reportId: 'report-004',
        reportDate: '2024-01-09',
        memberId: 'member-004',
        issueDescription: 'システムダウンの影響で作業停止。対応中です。',
      },
      {
        reportId: 'report-005',
        reportDate: '2024-01-09',
        memberId: 'member-005',
        issueDescription: 'デプロイエラーが再発。同じ箇所で2回目です。',
      },
      {
        reportId: 'report-006',
        reportDate: '2024-01-09',
        memberId: 'member-006',
        issueDescription: '顧客対応遅延による追加対応が発生。',
      },
      {
        reportId: 'report-007',
        reportDate: '2024-01-10',
        memberId: 'member-007',
        issueDescription: 'システムダウンが再度発生。根本原因の調査が必要。',
      },
      {
        reportId: 'report-008',
        reportDate: '2024-01-10',
        memberId: 'member-008',
        issueDescription: '顧客対応遅延で納期変更になりました。',
      },
      {
        reportId: 'report-009',
        reportDate: '2024-01-11',
        memberId: 'member-009',
        issueDescription: 'システムダウンの影響が広がっています。',
      },
      {
        reportId: 'report-010',
        reportDate: '2024-01-11',
        memberId: 'member-010',
        issueDescription: '顧客対応遅延の対応で時間が取られています。',
      },
      {
        reportId: 'report-011',
        reportDate: '2024-01-12',
        memberId: 'member-001',
        issueDescription: 'システムダウンの復旧完了。検証に時間を要しました。',
      },
      {
        reportId: 'report-012',
        reportDate: '2024-01-12',
        memberId: 'member-002',
        issueDescription: 'デプロイプロセスの改善案を検討中。',
      },
    ];

    // Tx6Imp1AiClient スタブの構造確認と作成
    const stubAiClient: Tx6Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'システムダウン', frequency: 5 },
          { keyword: '顧客対応遅延', frequency: 4 },
          { keyword: 'デプロイエラー', frequency: 3 },
        ],
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classifications: [
          { keyword: 'システムダウン', severity: 'high' },
          { keyword: '顧客対応遅延', severity: 'medium' },
          { keyword: 'デプロイエラー', severity: 'medium' },
        ],
      }),
      buildAction04Prompt: jest.fn().mockReturnValue('prompt for action-04'),
      buildAction01Prompt: jest.fn().mockReturnValue('prompt for action-01'),
      buildAction02Prompt: jest.fn().mockReturnValue('prompt for action-02'),
      buildAction03Prompt: jest.fn().mockReturnValue('prompt for action-03'),
      buildAction05Prompt: jest.fn().mockReturnValue('prompt for action-05'),
      buildAction06Prompt: jest.fn().mockReturnValue('prompt for action-06'),
      buildAction07Prompt: jest.fn().mockReturnValue('prompt for action-07'),
    };

    // 入力パラメータ
    const input = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      analysisStartDate: '2024-01-08',
      analysisEndDate: '2024-01-12',
      teamId: 'team-001',
    };

    // runTx6Imp1Agent 実行
    const result = await runTx6Imp1Agent(input, stubAiClient);

    // 結果検証: 基本的なレスポンス構造
    expect(result).toBeDefined();
    expect(result).toHaveProperty('executionStatus');
    expect(result).toHaveProperty('extractedIssueCount');
    expect(result).toHaveProperty('reportId');

    // 実行ステータス確認
    expect(['success', 'partial_failure', 'failure']).toContain(result.executionStatus);

    // 抽出された課題件数の確認（3種類の課題が抽出される）
    expect(result.extractedIssueCount).toBe(3);

    // action-04 の実行確認（buildAction04Prompt が呼ばれたことを確認）
    expect(stubAiClient.buildAction04Prompt).toHaveBeenCalled();

    // キーワード抽出の確認
    expect(stubAiClient.extractKeywords).toHaveBeenCalled();

    // 重要度分類の確認
    expect(stubAiClient.classifyIssueSeverity).toHaveBeenCalled();

    // レポートID が生成されたことを確認
    expect(result.reportId).toBeTruthy();
    expect(typeof result.reportId).toBe('string');

    // action-04 が正常に実行されたことを示す結果フィールドの確認
    // keywordFrequency: 出現頻度がソート済みで含まれていることを確認
    if (result.executionStatus === 'success' && result.topPriorityIssues) {
      // topPriorityIssues が優先度スコア順にソートされていることを確認
      expect(result.topPriorityIssues.length).toBeGreaterThan(0);
      
      // 最初の要素が「システムダウン」（出現頻度5、優先度スコア最高）であることを確認
      const firstIssue = result.topPriorityIssues[0];
      expect(firstIssue.issueKeyword).toBe('システムダウン');
      expect(firstIssue.occurrenceCount).toBe(5);
      expect(firstIssue.priorityRank).toBe('high');

      // 2番目の要素が「顧客対応遅延」（出現頻度4）であることを確認
      const secondIssue = result.topPriorityIssues[1];
      expect(secondIssue.issueKeyword).toBe('顧客対応遅延');
      expect(secondIssue.occurrenceCount).toBe(4);

      // 3番目の要素が「デプロイエラー」（出現頻度3）であることを確認
      const thirdIssue = result.topPriorityIssues[2];
      expect(thirdIssue.issueKeyword).toBe('デプロイエラー');
      expect(thirdIssue.occurrenceCount).toBe(3);
    }

    // レポート生成時刻が記録されたことを確認
    expect(result).toHaveProperty('reportGeneratedAt');
    expect(result.reportGeneratedAt).toBeInstanceOf(Date);

    // メール送信時刻が記録されたことを確認
    expect(result).toHaveProperty('emailSentAt');
    expect(result.emailSentAt).toBeInstanceOf(Date);
  });
});