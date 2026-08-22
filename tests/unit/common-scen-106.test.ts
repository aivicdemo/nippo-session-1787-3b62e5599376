import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';

// Mock types for Tx6Imp1AiClient
interface Tx6Imp1AiClient {
  buildAction01Prompt: jest.Mock;
  buildAction02Prompt: jest.Mock;
  buildAction03Prompt: jest.Mock;
  buildAction04Prompt: jest.Mock;
  buildAction05Prompt: jest.Mock;
  buildAction06Prompt: jest.Mock;
  buildAction07Prompt: jest.Mock;
}

interface AuditLog {
  action: string;
  timestamp: string;
  details: string;
}

interface ReportDeliveryLog {
  recipient: string;
  deliveryTimestamp: string;
  reportBody: string;
}

describe('Tx6Imp1Agent - 日報収集から分析レポート生成までの自動実行', () => {
  let mockAiClient: Tx6Imp1AiClient;
  let auditLogs: AuditLog[];
  let reportDeliveryLogs: ReportDeliveryLog[];
  const executionTimestamp = new Date('2024-01-08T08:00:00Z');
  const analysisStartDate = '2024-01-01';
  const analysisEndDate = '2024-01-07';
  const teamId = 'team-001';

  beforeEach(() => {
    auditLogs = [];
    reportDeliveryLogs = [];

    // Mock AI Client with all required prompts
    mockAiClient = {
      buildAction01Prompt: jest.fn().mockReturnValue({
        prompt: '前週の日報データを自動収集するプロンプト',
        version: '1.0',
      }),
      buildAction02Prompt: jest.fn().mockReturnValue({
        prompt: '未提出メンバー特定・リマインドプロンプト',
        version: '1.0',
        unsubmittedMembers: [],
      }),
      buildAction03Prompt: jest.fn().mockReturnValue({
        prompt: '課題項目抽出・分類プロンプト',
        version: '1.0',
        extractedIssues: [
          { keyword: 'API性能低下', count: 2, category: '技術課題' },
          { keyword: '顧客サポート対応', count: 1, category: '業務課題' },
          { keyword: 'テスト環境不安定', count: 3, category: 'インフラ課題' },
        ],
      }),
      buildAction04Prompt: jest.fn().mockReturnValue({
        prompt: '課題発生頻度・カテゴリ別傾向分析プロンプト',
        version: '1.0',
        trends: {
          技術課題: { frequency: 2, trend: '増加' },
          業務課題: { frequency: 1, trend: '安定' },
          インフラ課題: { frequency: 3, trend: '増加' },
        },
      }),
      buildAction05Prompt: jest.fn().mockReturnValue({
        prompt: '優先度スコアリングプロンプト',
        version: '1.0',
        priorityScores: [
          { keyword: 'テスト環境不安定', score: 85, rank: '高' },
          { keyword: 'API性能低下', score: 72, rank: '中' },
          { keyword: '顧客サポート対応', score: 60, rank: '中' },
        ],
      }),
      buildAction06Prompt: jest.fn().mockReturnValue({
        prompt: '分析結果レポート生成プロンプト',
        version: '1.0',
        report: {
          generatedAt: new Date('2024-01-08T08:15:00Z').toISOString(),
          periodStart: analysisStartDate,
          periodEnd: analysisEndDate,
          extractedIssueCount: 3,
          topPriorityIssues: [
            { issueKeyword: 'テスト環境不安定', occurrenceCount: 3, priorityScore: 85, priorityRank: '高' },
            { issueKeyword: 'API性能低下', occurrenceCount: 2, priorityScore: 72, priorityRank: '中' },
            { issueKeyword: '顧客サポート対応', occurrenceCount: 1, priorityScore: 60, priorityRank: '中' },
          ],
        },
      }),
      buildAction07Prompt: jest.fn().mockReturnValue({
        prompt: '部長・ステークホルダーへレポート配信プロンプト',
        version: '1.0',
      }),
    };

    // Mock global console for audit logging
    global.console.log = jest.fn((message: string) => {
      if (message.includes('AUDIT')) {
        auditLogs.push({
          action: message,
          timestamp: new Date().toISOString(),
          details: message,
        });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-106
  test('should execute complete autonomous workflow from report collection to analysis delivery without human approval', async () => {
    // Setup stub DB with 10 members' weekly reports
    const stubReportData = [
      {
        memberId: 'member-001',
        name: 'メンバーA',
        yesterday: 'API実装',
        today: 'テスト実施',
        issues: ['テスト環境不安定'],
      },
      {
        memberId: 'member-002',
        name: 'メンバーB',
        yesterday: '環境構築',
        today: 'テスト実施',
        issues: ['テスト環境不安定', 'API性能低下'],
      },
      {
        memberId: 'member-003',
        name: 'メンバーC',
        yesterday: 'ドキュメント作成',
        today: 'レビュー',
        issues: [],
      },
      {
        memberId: 'member-004',
        name: 'メンバーD',
        yesterday: 'バグ修正',
        today: '統合テスト',
        issues: ['API性能低下'],
      },
      {
        memberId: 'member-005',
        name: 'メンバーE',
        yesterday: 'デプロイ準備',
        today: 'デプロイ実行',
        issues: ['顧客サポート対応'],
      },
      {
        memberId: 'member-006',
        name: 'メンバーF',
        yesterday: 'ログ分析',
        today: '障害対応',
        issues: ['テスト環境不安定'],
      },
      {
        memberId: 'member-007',
        name: 'メンバーG',
        yesterday: 'パフォーマンス測定',
        today: '最適化',
        issues: [],
      },
      {
        memberId: 'member-008',
        name: 'メンバーH',
        yesterday: 'セキュリティレビュー',
        today: '改善実装',
        issues: [],
      },
      {
        memberId: 'member-009',
        name: 'メンバーI',
        yesterday: 'リリース計画',
        today: 'リリース実行',
        issues: ['テスト環境不安定'],
      },
      {
        memberId: 'member-010',
        name: 'メンバーJ',
        yesterday: 'チームミーティング',
        today: 'デリバリー確認',
        issues: [],
      },
    ];

    // Execute agent with injected mock AI client
    const result = await runTx6Imp1Agent(
      {
        executionTimestamp,
        analysisStartDate,
        analysisEndDate,
        teamId,
      },
      mockAiClient as any
    );

    // Verify Action 1 execution: buildAction01Prompt called for report collection
    expect(mockAiClient.buildAction01Prompt).toHaveBeenCalled();
    const action01Call = mockAiClient.buildAction01Prompt.mock.calls[0];
    expect(action01Call).toBeDefined();
    const action01Result = mockAiClient.buildAction01Prompt();
    expect(action01Result.prompt).toContain('自動収集');

    // Verify Action 2 execution: buildAction02Prompt called for unsubmitted members detection
    expect(mockAiClient.buildAction02Prompt).toHaveBeenCalled();
    const action02Call = mockAiClient.buildAction02Prompt.mock.calls[0];
    expect(action02Call).toBeDefined();
    const action02Result = mockAiClient.buildAction02Prompt();
    expect(action02Result.unsubmittedMembers).toEqual([]);

    // Verify Action 3 execution: buildAction03Prompt called for issue extraction and classification
    expect(mockAiClient.buildAction03Prompt).toHaveBeenCalled();
    const action03Call = mockAiClient.buildAction03Prompt.mock.calls[0];
    expect(action03Call).toBeDefined();
    const action03Result = mockAiClient.buildAction03Prompt();
    expect(action03Result.extractedIssues.length).toBeGreaterThanOrEqual(3);
    expect(action03Result.extractedIssues[0]).toHaveProperty('keyword');
    expect(action03Result.extractedIssues[0]).toHaveProperty('count');
    expect(action03Result.extractedIssues[0]).toHaveProperty('category');

    // Verify Action 4 execution: buildAction04Prompt called for trend analysis
    expect(mockAiClient.buildAction04Prompt).toHaveBeenCalled();
    const action04Call = mockAiClient.buildAction04Prompt.mock.calls[0];
    expect(action04Call).toBeDefined();
    const action04Result = mockAiClient.buildAction04Prompt();
    expect(action04Result.trends).toBeDefined();
    expect(Object.keys(action04Result.trends).length).toBeGreaterThan(0);

    // Verify Action 5 execution: buildAction05Prompt called for priority scoring
    expect(mockAiClient.buildAction05Prompt).toHaveBeenCalled();
    const action05Call = mockAiClient.buildAction05Prompt.mock.calls[0];
    expect(action05Call).toBeDefined();
    const action05Result = mockAiClient.buildAction05Prompt();
    expect(action05Result.priorityScores.length).toBeGreaterThan(0);
    expect(action05Result.priorityScores[0]).toHaveProperty('keyword');
    expect(action05Result.priorityScores[0]).toHaveProperty('score');
    expect(action05Result.priorityScores[0]).toHaveProperty('rank');

    // Verify Action 6 execution: buildAction06Prompt called for report generation
    expect(mockAiClient.buildAction06Prompt).toHaveBeenCalled();
    const action06Call = mockAiClient.buildAction06Prompt.mock.calls[0];
    expect(action06Call).toBeDefined();
    const action06Result = mockAiClient.buildAction06Prompt();
    expect(action06Result.report.generatedAt).toBeDefined();
    expect(action06Result.report.extractedIssueCount).toBeGreaterThanOrEqual(3);
    expect(action06Result.report.topPriorityIssues.length).toBeGreaterThanOrEqual(3);

    // Verify Action 7 execution: buildAction07Prompt called for report delivery
    expect(mockAiClient.buildAction07Prompt).toHaveBeenCalled();
    const action07Call = mockAiClient.buildAction07Prompt.mock.calls[0];
    expect(action07Call).toBeDefined();

    // Verify report delivery log
    const deliveryReport = action06Result.report;
    expect(deliveryReport.periodStart).toBe(analysisStartDate);
    expect(deliveryReport.periodEnd).toBe(analysisEndDate);
    expect(deliveryReport.topPriorityIssues[0].issueKeyword).toBe('テスト環境不安定');
    expect(deliveryReport.topPriorityIssues[0].priorityScore).toBe(85);
    expect(deliveryReport.topPriorityIssues[0].priorityRank).toBe('高');
    expect(deliveryReport.topPriorityIssues[1].priorityScore).toBe(72);
    expect(deliveryReport.topPriorityIssues[2].priorityScore).toBe(60);

    // Verify normal completion without errors
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.reportId).toBeDefined();
    expect(result.reportGeneratedAt).toBeDefined();
    expect(result.emailSentAt).toBeDefined();
    expect(result.extractedIssueCount).toBe(3);

    // Verify top priority issues structure
    expect(result.topPriorityIssues).toHaveLength(3);
    expect(result.topPriorityIssues[0].issueKeyword).toBe('テスト環境不安定');
    expect(result.topPriorityIssues[0].occurrenceCount).toBe(3);
    expect(result.topPriorityIssues[0].priorityScore).toBe(85);
    expect(result.topPriorityIssues[0].priorityRank).toBe('高');

    // Verify execution order: all actions called in sequence
    expect(mockAiClient.buildAction01Prompt.mock.invocationCallOrder[0]).toBeLessThan(
      mockAiClient.buildAction02Prompt.mock.invocationCallOrder[0]
    );
    expect(mockAiClient.buildAction02Prompt.mock.invocationCallOrder[0]).toBeLessThan(
      mockAiClient.buildAction03Prompt.mock.invocationCallOrder[0]
    );
    expect(mockAiClient.buildAction03Prompt.mock.invocationCallOrder[0]).toBeLessThan(
      mockAiClient.buildAction04Prompt.mock.invocationCallOrder[0]
    );
    expect(mockAiClient.buildAction04Prompt.mock.invocationCallOrder[0]).toBeLessThan(
      mockAiClient.buildAction05Prompt.mock.invocationCallOrder[0]
    );
    expect(mockAiClient.buildAction05Prompt.mock.invocationCallOrder[0]).toBeLessThan(
      mockAiClient.buildAction06Prompt.mock.invocationCallOrder[0]
    );
    expect(mockAiClient.buildAction06Prompt.mock.invocationCallOrder[0]).toBeLessThan(
      mockAiClient.buildAction07Prompt.mock.invocationCallOrder[0]
    );

    // Verify no human approval step required
    expect(result.requiresHumanApproval).toBe(false);

    // Verify audit log contains completion event
    const completionLog = auditLogs.find((log) => log.action.includes('tx_6_imp_1'));
    if (completionLog) {
      expect(completionLog.details).toContain('実行完了');
    }
  });
});