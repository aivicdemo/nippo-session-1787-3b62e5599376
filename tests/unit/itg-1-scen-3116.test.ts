import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import type {
  Tx3Imp1AgentInput,
  Tx3Imp1AgentOutput,
  PrioritizedIssue,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('tx-3-imp-1: 日報集約から優先度別課題一覧提示までの自動判定・配信', () => {
  // SCEN-3116
  test('should execute autonomous priority judgment action and generate prioritized issues list in correct order', async () => {
    // Arrange: テスト用の集約済み日報データセットを準備
    const aggregatedReports = [
      {
        reportId: 'report-001',
        teamId: 'team-alpha',
        authorId: 'engineer-001',
        reportDate: '2024-01-15',
        yesterdayWork: 'API実装完了',
        todayWork: 'テスト実施',
        challenges:
          'システム遅延が発生している。パフォーマンスが低下している。',
      },
      {
        reportId: 'report-002',
        teamId: 'team-alpha',
        authorId: 'engineer-002',
        reportDate: '2024-01-15',
        yesterdayWork: 'ドキュメント作成',
        todayWork: 'レビュー対応',
        challenges: '顧客対応漏れが発生した。重要な連絡を見落とした。',
      },
      {
        reportId: 'report-003',
        teamId: 'team-alpha',
        authorId: 'engineer-003',
        reportDate: '2024-01-15',
        yesterdayWork: '要件確認',
        todayWork: 'デザイン作成',
        challenges: 'ドキュメント不備がある。仕様書の記載漏れがある。',
      },
    ];

    // TextAnalysisServiceAdapterのスタブを作成
    const stubTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'システム遅延', frequency: 1 },
        { keyword: '顧客対応漏れ', frequency: 1 },
        { keyword: 'ドキュメント不備', frequency: 1 },
      ]),
      assessImpactScore: jest
        .fn()
        .mockImplementation((keyword: string) => {
          const scoreMap: Record<string, number> = {
            'システム遅延': 8,
            '顧客対応漏れ': 6,
            'ドキュメント不備': 4,
          };
          return Promise.resolve(scoreMap[keyword] || 5);
        }),
      classifyIssueSeverity: jest
        .fn()
        .mockImplementation((keyword: string) => {
          const severityMap: Record<string, string> = {
            'システム遅延': '高',
            '顧客対応漏れ': '中',
            'ドキュメント不備': '低',
          };
          return Promise.resolve(severityMap[keyword] || '中');
        }),
    };

    // Tx3Imp1AiClientインターフェースを満たすフェイクAIクライアントを作成
    const fakeAiClient = {
      callAction01: jest
        .fn()
        .mockResolvedValue({ aggregatedReportsCount: 3 }),
      callAction02: jest.fn().mockResolvedValue({
        extractedKeywords: ['システム遅延', '顧客対応漏れ', 'ドキュメント不備'],
      }),
      callAction03: jest.fn().mockResolvedValue({
        priorityScores: [
          { keyword: 'システム遅延', score: 9.2 },
          { keyword: '顧客対応漏れ', score: 6.4 },
          { keyword: 'ドキュメント不備', score: 3.6 },
        ],
      }),
      callAction04: jest.fn().mockResolvedValue({
        priorityRanks: [
          { keyword: 'システム遅延', rank: 1 },
          { keyword: '顧客対応漏れ', rank: 2 },
          { keyword: 'ドキュメント不備', rank: 3 },
        ],
      }),
      callAction05: jest.fn().mockResolvedValue({
        emailStatus: 'success',
      }),
    };

    // テスト入力を準備
    const testInput: Tx3Imp1AgentInput = {
      aggregatedReportIds: ['report-001', 'report-002', 'report-003'],
      analysisStartDate: '2024-01-15T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      managerUserId: 'manager-001',
      priorityThresholdScore: 70,
    };

    // Act: runTx3Imp1Agentを実行
    const result: Tx3Imp1AgentOutput = await runTx3Imp1Agent(
      testInput,
      fakeAiClient
    );

    // Assert: Action-03（優先度自動判定）の実行結果を検証
    expect(fakeAiClient.callAction03).toHaveBeenCalled();

    // 優先度スコアの計算ロジックを検証
    // 優先度スコア = (影響範囲スコア × 0.4) + (緊急度レベルのスコア値 × 0.4) + (再発リスク有無 × 0.2 × 10)
    // 緊急度スコア値: 高=10, 中=5, 低=0

    // システム遅延: (8 × 0.4) + (10 × 0.4) + (1 × 0.2 × 10) = 3.2 + 4.0 + 2.0 = 9.2 ✓
    // 顧客対応漏れ: (6 × 0.4) + (5 × 0.4) + (0 × 0.2 × 10) = 2.4 + 2.0 + 0.0 = 4.4
    // ドキュメント不備: (4 × 0.4) + (0 × 0.4) + (0 × 0.2 × 10) = 1.6 + 0.0 + 0.0 = 1.6

    // 生成された優先度別課題一覧の検証
    expect(result.extractedIssuesCount).toBe(3);
    expect(result.prioritizedIssuesList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssuesList)).toBe(true);
    expect(result.prioritizedIssuesList.length).toBe(3);

    // 各課題の優先度判定結果を検証
    const prioritizedList = result.prioritizedIssuesList;

    // 優先度1: システム遅延 (スコア 9.2 以上)
    expect(prioritizedList[0].issueName).toBe('システム遅延');
    expect(prioritizedList[0].priorityLevel).toBe(1);
    expect(prioritizedList[0].priorityScore).toBe(9.2);

    // 優先度2: 顧客対応漏れ (スコア 5.2～9.1の範囲内)
    expect(prioritizedList[1].issueName).toBe('顧客対応漏れ');
    expect(prioritizedList[1].priorityLevel).toBe(2);
    expect(prioritizedList[1].priorityScore).toBeGreaterThanOrEqual(5.2);
    expect(prioritizedList[1].priorityScore).toBeLessThanOrEqual(9.1);

    // 優先度3: ドキュメント不備 (スコア 5.1 以下)
    expect(prioritizedList[2].issueName).toBe('ドキュメント不備');
    expect(prioritizedList[2].priorityLevel).toBe(3);
    expect(prioritizedList[2].priorityScore).toBeLessThanOrEqual(5.1);

    // 優先度別課題一覧の構造を検証
    prioritizedList.forEach((issue: PrioritizedIssue) => {
      expect(issue).toHaveProperty('issueId');
      expect(issue).toHaveProperty('issueName');
      expect(issue).toHaveProperty('priorityLevel');
      expect([1, 2, 3]).toContain(issue.priorityLevel);
      expect(issue).toHaveProperty('priorityScore');
      expect(typeof issue.priorityScore).toBe('number');
      expect(issue).toHaveProperty('judgmentReason');
      expect(typeof issue.judgmentReason).toBe('string');
      expect(issue).toHaveProperty('sourceReportIds');
      expect(Array.isArray(issue.sourceReportIds)).toBe(true);
    });

    // 判定根拠に具体的な値が記録されていることを検証
    const firstIssueReason = prioritizedList[0].judgmentReason;
    expect(firstIssueReason).toMatch(/影響範囲|緊急度|再発/);
    expect(firstIssueReason).toMatch(/優先度/);

    // メール送信ステータスを検証
    expect(result.emailSendStatus).toBe('success');

    // 完了タイムスタンプが ISO 8601 形式であることを検証
    expect(result.completionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
    );

    // 実行IDが生成されていることを検証
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);
  });
});