import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import type {
  Tx3Imp1AgentInput,
  Tx3Imp1AgentOutput,
  Tx3Imp1AiClient,
  PrioritizedIssue,
  AgentExecutionContext,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('tx-3-imp-1: 日報集約から優先度別課題一覧提示までの自動判定・配信', () => {
  test('SCEN-3113: [normal] AIエージェントが集約済み日報から課題を自動抽出・分類・優先度付けしてメール配信する', async () => {
    // ========== テスト用集約済み日報データ準備 ==========
    const aggregatedReportIds = [
      'report-001',
      'report-002',
      'report-003',
    ];
    const analysisStartDate = '2024-01-15T00:00:00Z';
    const analysisEndDate = '2024-01-15T23:59:59Z';
    const managerUserId = 'manager-user-001';
    const priorityThresholdScore = 70;

    const executionContext: AgentExecutionContext = {
      executingUserId: 'system-agent',
      teamId: 'team-dev-001',
      retryAttempt: 0,
    };

    // ========== モック Tx3Imp1AiClient の実装 ==========
    const mockAiClient: Tx3Imp1AiClient = {
      callAction01ExtractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'DB接続エラー', frequency: 3, confidence: 0.95 },
          { keyword: 'ログ出力遅延', frequency: 2, confidence: 0.88 },
          { keyword: 'セキュリティパッチ未適用', frequency: 1, confidence: 0.92 },
        ],
      }),
      callAction02ClassifyCategory: jest.fn().mockResolvedValue({
        classifications: [
          {
            keyword: 'DB接続エラー',
            category: 'システム障害',
            confidence: 0.96,
          },
          {
            keyword: 'ログ出力遅延',
            category: '運用改善',
            confidence: 0.87,
          },
          {
            keyword: 'セキュリティパッチ未適用',
            category: 'セキュリティ',
            confidence: 0.93,
          },
        ],
      }),
      callAction03PrioritizeIssues: jest.fn().mockResolvedValue({
        prioritized_issues: [
          {
            issue_id: 'issue-001',
            keyword: 'セキュリティパッチ未適用',
            category: 'セキュリティ',
            priority_score: 92,
            impact_range: '全システム',
            urgency: '高',
            reoccurrence_risk: '高',
            rationale:
              'セキュリティリスクは組織全体に波及し即座の対応が必須',
          },
          {
            issue_id: 'issue-002',
            keyword: 'DB接続エラー',
            category: 'システム障害',
            priority_score: 78,
            impact_range: '本システム',
            urgency: '中',
            reoccurrence_risk: '中',
            rationale:
              'システム機能の一部が影響を受け、ユーザー業務に支障あり',
          },
          {
            issue_id: 'issue-003',
            keyword: 'ログ出力遅延',
            category: '運用改善',
            priority_score: 62,
            impact_range: '運用チーム',
            urgency: '低',
            reoccurrence_risk: '低',
            rationale:
              '運用効率の向上が目的で、直近の業務機能には直接影響なし',
          },
        ],
      }),
      callAction04GenerateList: jest.fn().mockResolvedValue({
        issue_list: [
          {
            issue_id: 'issue-001',
            issue_content: 'セキュリティパッチが未適用のまま本番環境で稼働',
            category: 'セキュリティ',
            priority_score: 92,
            impact_range: '全システム',
            color_code: 'red',
          },
          {
            issue_id: 'issue-002',
            issue_content: 'データベース接続エラーが間欠的に発生している',
            category: 'システム障害',
            priority_score: 78,
            impact_range: '本システム',
            color_code: 'yellow',
          },
          {
            issue_id: 'issue-003',
            issue_content: 'ログ出力に数秒の遅延が生じている',
            category: '運用改善',
            priority_score: 62,
            impact_range: '運用チーム',
            color_code: 'green',
          },
        ],
        generated_at: '2024-01-15T09:30:00Z',
      }),
      callAction05SendEmail: jest.fn().mockResolvedValue({
        email_id: 'email-msg-001',
        recipient: 'manager-user-001',
        status: 'success',
        sent_at: '2024-01-15T09:31:00Z',
        delivery_status: '配信成功',
      }),
    };

    // ========== オーケストレーター実行 ==========
    const result = await runTx3Imp1Agent(
      {
        aggregatedReportIds,
        analysisStartDate,
        analysisEndDate,
        managerUserId,
        priorityThresholdScore,
      },
      mockAiClient,
      executionContext,
    );

    // ========== Assertion: Action 1 - キーワード抽出確認 ==========
    expect(mockAiClient.callAction01ExtractKeywords).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction01ExtractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregatedReportIds,
        analysisStartDate,
        analysisEndDate,
      }),
    );

    // ========== Assertion: Action 2 - カテゴリ分類確認 ==========
    expect(mockAiClient.callAction02ClassifyCategory).toHaveBeenCalledTimes(1);
    const action02Call = (mockAiClient.callAction02ClassifyCategory as jest.Mock).mock.calls[0];
    expect(action02Call[0]).toHaveProperty('keywords');
    expect(action02Call[0].keywords).toHaveLength(3);

    // ========== Assertion: Action 3 - 優先度自動判定確認 ==========
    expect(mockAiClient.callAction03PrioritizeIssues).toHaveBeenCalledTimes(1);
    const action03Call = (mockAiClient.callAction03PrioritizeIssues as jest.Mock).mock.calls[0];
    expect(action03Call[0]).toHaveProperty('classifications');
    expect(action03Call[0].priorityThresholdScore).toBe(70);

    // ========== Assertion: Action 4 - 優先度別一覧生成確認 ==========
    expect(mockAiClient.callAction04GenerateList).toHaveBeenCalledTimes(1);
    const action04Call = (mockAiClient.callAction04GenerateList as jest.Mock).mock.calls[0];
    expect(action04Call[0]).toHaveProperty('prioritized_issues');
    expect(action04Call[0].prioritized_issues).toHaveLength(3);

    // ========== Assertion: Action 5 - メール送信確認 ==========
    expect(mockAiClient.callAction05SendEmail).toHaveBeenCalledTimes(1);
    const action05Call = (mockAiClient.callAction05SendEmail as jest.Mock).mock.calls[0];
    expect(action05Call[0]).toHaveProperty('managerUserId', 'manager-user-001');
    expect(action05Call[0]).toHaveProperty('issue_list');

    // ========== Assertion: オーケストレーター戻り値検証 ==========
    expect(result).toBeDefined();
    expect(result).toHaveProperty('executionId');
    expect(result).toHaveProperty('extractedIssuesCount', 3);
    expect(result).toHaveProperty('prioritizedIssuesList');
    expect(result).toHaveProperty('emailSendStatus', 'success');
    expect(result).toHaveProperty('completionTimestamp');

    // ========== Assertion: 優先度別課題一覧内容検証 ==========
    const prioritizedList = result.prioritizedIssuesList as PrioritizedIssue[];
    expect(prioritizedList).toHaveLength(3);

    // Issue 1: セキュリティ（最優先、優先度スコア 92）
    expect(prioritizedList[0]).toHaveProperty('issue_id', 'issue-001');
    expect(prioritizedList[0]).toHaveProperty(
      'issue_content',
      'セキュリティパッチが未適用のまま本番環境で稼働',
    );
    expect(prioritizedList[0]).toHaveProperty('category', 'セキュリティ');
    expect(prioritizedList[0]).toHaveProperty('priority_score', 92);
    expect(prioritizedList[0]).toHaveProperty('impact_range', '全システム');
    expect(prioritizedList[0]).toHaveProperty('color_code', 'red');

    // Issue 2: システム障害（中優先度、スコア 78）
    expect(prioritizedList[1]).toHaveProperty('issue_id', 'issue-002');
    expect(prioritizedList[1]).toHaveProperty(
      'issue_content',
      'データベース接続エラーが間欠的に発生している',
    );
    expect(prioritizedList[1]).toHaveProperty('category', 'システム障害');
    expect(prioritizedList[1]).toHaveProperty('priority_score', 78);
    expect(prioritizedList[1]).toHaveProperty('impact_range', '本システム');
    expect(prioritizedList[1]).toHaveProperty('color_code', 'yellow');

    // Issue 3: 運用改善（低優先度、スコア 62）
    expect(prioritizedList[2]).toHaveProperty('issue_id', 'issue-003');
    expect(prioritizedList[2]).toHaveProperty('issue_content', 'ログ出力に数秒の遅延が生じている');
    expect(prioritizedList[2]).toHaveProperty('category', '運用改善');
    expect(prioritizedList[2]).toHaveProperty('priority_score', 62);
    expect(prioritizedList[2]).toHaveProperty('impact_range', '運用チーム');
    expect(prioritizedList[2]).toHaveProperty('color_code', 'green');

    // ========== Assertion: 優先度スコアの順序確認（降順） ==========
    expect(prioritizedList[0].priority_score).toBeGreaterThan(
      prioritizedList[1].priority_score,
    );
    expect(prioritizedList[1].priority_score).toBeGreaterThan(
      prioritizedList[2].priority_score,
    );

    // ========== Assertion: エスカレーション フラグなし ==========
    expect(result).not.toHaveProperty('escalation_flag');

    // ========== Assertion: 完了ステータス検証 ==========
    expect(result).toHaveProperty('final_status', '完了');
    expect(result).toHaveProperty('human_review_required', false);

    // ========== Assertion: 監査ログ記録確認 ==========
    expect(result).toHaveProperty('auditLog');
    const auditLog = result.auditLog as Array<{
      timestamp: string;
      action: string;
      status: string;
      details?: unknown;
    }>;
    expect(auditLog.length).toBeGreaterThanOrEqual(5);
    expect(auditLog.map(log => log.action)).toContain('Action 1: Extract Keywords');
    expect(auditLog.map(log => log.action)).toContain('Action 2: Classify Category');
    expect(auditLog.map(log => log.action)).toContain('Action 3: Prioritize Issues');
    expect(auditLog.map(log => log.action)).toContain('Action 4: Generate List');
    expect(auditLog.map(log => log.action)).toContain('Action 5: Send Email');

    // ========== Assertion: メール送信イベント確認 ==========
    const emailEvent = auditLog.find(log => log.action.includes('Send Email'));
    expect(emailEvent).toBeDefined();
    expect(emailEvent?.status).toBe('success');
    expect(emailEvent?.details).toHaveProperty('email_id', 'email-msg-001');
    expect(emailEvent?.details).toHaveProperty('delivery_status', '配信成功');

    // ========== Assertion: completionTimestamp の有効性 ==========
    const completionTimestamp = new Date(result.completionTimestamp as string);
    expect(completionTimestamp.getTime()).toBeGreaterThan(0);
    expect(completionTimestamp.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });
});