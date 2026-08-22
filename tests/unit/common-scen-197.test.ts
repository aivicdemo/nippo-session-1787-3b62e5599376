import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-11-imp-1/prompts/action-03';
import type { Tx11AgentInput, Tx11AgentOutput, SubmissionStatusSummary } from '../../src/agents/tx-11-imp-1/types';

interface ExtractedIssue {
  issueId: string;
  issueText: string;
  sourceReportId: string;
}

interface AuditEvent {
  action: string;
  timestamp: string;
  targetReportCount: number;
  extractedIssueCount: number;
  executedBy: string;
}

interface MockAiResponse {
  extractedIssues: ExtractedIssue[];
}

interface FakeAiClientConfig {
  extractedIssues: ExtractedIssue[];
}

interface Tx11Imp1AiClient {
  generateAction01Prompt: (input: Tx11AgentInput) => Promise<string>;
  generateAction02Prompt: (input: Tx11AgentInput) => Promise<string>;
  generateAction03Prompt: (reportData: object[]) => Promise<string>;
  generateAction04Prompt: (input: object) => Promise<string>;
  generateAction05Prompt: (input: object) => Promise<string>;
  generateAction06Prompt: (input: object) => Promise<string>;
  generateAction07Prompt: (input: object) => Promise<string>;
  callAi: (prompt: string) => Promise<MockAiResponse>;
}

describe('tx-11-imp-1: 日報収集・確認・催促の自動化エージェント', () => {
  let mockAiClient: Tx11Imp1AiClient;
  let auditLog: AuditEvent[];

  beforeEach(() => {
    auditLog = [];

    const fakeConfig: FakeAiClientConfig = {
      extractedIssues: [
        { issueId: 'issue-001', issueText: 'DBコネクション数が限界に達している', sourceReportId: 'report-001' },
        { issueId: 'issue-002', issueText: 'テスト自動化の進捗が遅延している', sourceReportId: 'report-001' },
        { issueId: 'issue-003', issueText: 'APIレスポンス時間が3秒を超えている', sourceReportId: 'report-002' },
        { issueId: 'issue-004', issueText: 'ドキュメント更新が対応できていない', sourceReportId: 'report-003' },
        { issueId: 'issue-005', issueText: 'デプロイプロセスにエラーが多発している', sourceReportId: 'report-003' },
        { issueId: 'issue-006', issueText: 'チームメンバーのスキルギャップが大きい', sourceReportId: 'report-004' },
        { issueId: 'issue-007', issueText: '顧客からのバグ報告数が増加している', sourceReportId: 'report-004' },
        { issueId: 'issue-008', issueText: 'リソース不足により納期が危ぶまれている', sourceReportId: 'report-005' },
      ],
    };

    mockAiClient = {
      generateAction01Prompt: jest.fn().mockResolvedValue('action-01-prompt'),
      generateAction02Prompt: jest.fn().mockResolvedValue('action-02-prompt'),
      generateAction03Prompt: jest.fn(async (reportData) => {
        const prompt = buildAction03Prompt(reportData);
        expect(prompt).toBeDefined();
        expect(prompt.length).toBeGreaterThan(0);
        return prompt;
      }),
      generateAction04Prompt: jest.fn().mockResolvedValue('action-04-prompt'),
      generateAction05Prompt: jest.fn().mockResolvedValue('action-05-prompt'),
      generateAction06Prompt: jest.fn().mockResolvedValue('action-06-prompt'),
      generateAction07Prompt: jest.fn().mockResolvedValue('action-07-prompt'),
      callAi: jest.fn(async (prompt: string): Promise<MockAiResponse> => {
        if (prompt.includes('issue') || prompt.includes('抽出')) {
          return { extractedIssues: fakeConfig.extractedIssues };
        }
        return { extractedIssues: [] };
      }),
    };
  });

  test('SCEN-197: Action3 提出された日報から課題を自動抽出する', async () => {
    // テスト用日報データセットの準備：複数メンバーから提出された日報5件
    const submittedReports = [
      {
        reportId: 'report-001',
        memberId: 'member-001',
        submittedAt: new Date('2024-01-15T09:00:00Z'),
        previousAccomplishment: 'API実装が完了した',
        todayPlan: 'テスト環境でのテストを実施する',
        issues: 'DBコネクション数が限界に達している。テスト自動化の進捗が遅延している。',
      },
      {
        reportId: 'report-002',
        memberId: 'member-002',
        submittedAt: new Date('2024-01-15T09:15:00Z'),
        previousAccomplishment: 'フロントエンド修正を完了した',
        todayPlan: 'バックエンドとの統合テストを開始する',
        issues: 'APIレスポンス時間が3秒を超えている。',
      },
      {
        reportId: 'report-003',
        memberId: 'member-003',
        submittedAt: new Date('2024-01-15T09:30:00Z'),
        previousAccomplishment: 'デザイン仕様書を作成した',
        todayPlan: '仕様書をチームで共有する',
        issues: 'ドキュメント更新が対応できていない。デプロイプロセスにエラーが多発している。',
      },
      {
        reportId: 'report-004',
        memberId: 'member-004',
        submittedAt: new Date('2024-01-15T09:45:00Z'),
        previousAccomplishment: 'ユーザートレーニング資料を整理した',
        todayPlan: 'トレーニングセッションを実施する',
        issues: 'チームメンバーのスキルギャップが大きい。顧客からのバグ報告数が増加している。',
      },
      {
        reportId: 'report-005',
        memberId: 'member-005',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        previousAccomplishment: 'プロジェクト進捗を集計した',
        todayPlan: 'マイルストーンの進捗確認を行う',
        issues: 'リソース不足により納期が危ぶまれている。',
      },
    ];

    // 各日報に『昨日やったこと』『今日やること』『抱えている課題』の3項目が含まれていることを確認
    submittedReports.forEach((report) => {
      expect(report.previousAccomplishment).toBeDefined();
      expect(report.previousAccomplishment.length).toBeGreaterThan(0);
      expect(report.todayPlan).toBeDefined();
      expect(report.todayPlan.length).toBeGreaterThan(0);
      expect(report.issues).toBeDefined();
      expect(report.issues.length).toBeGreaterThan(0);
    });

    // テスト用入力データの準備
    const agentInput: Tx11AgentInput = {
      executionTimestamp: new Date('2024-01-15T11:00:00Z'),
      teamId: 'team-001',
      reportDeadlineTime: '09:00',
      managerEmail: 'manager@example.com',
    };

    // fakeなAIクライアント（Tx11Imp1AiClient）の構造確認
    expect(mockAiClient).toHaveProperty('generateAction01Prompt');
    expect(mockAiClient).toHaveProperty('generateAction02Prompt');
    expect(mockAiClient).toHaveProperty('generateAction03Prompt');
    expect(mockAiClient).toHaveProperty('generateAction04Prompt');
    expect(mockAiClient).toHaveProperty('generateAction05Prompt');
    expect(mockAiClient).toHaveProperty('generateAction06Prompt');
    expect(mockAiClient).toHaveProperty('generateAction07Prompt');
    expect(mockAiClient).toHaveProperty('callAi');
    expect(typeof mockAiClient.generateAction01Prompt).toBe('function');
    expect(typeof mockAiClient.generateAction02Prompt).toBe('function');
    expect(typeof mockAiClient.generateAction03Prompt).toBe('function');
    expect(typeof mockAiClient.generateAction04Prompt).toBe('function');
    expect(typeof mockAiClient.generateAction05Prompt).toBe('function');
    expect(typeof mockAiClient.generateAction06Prompt).toBe('function');
    expect(typeof mockAiClient.generateAction07Prompt).toBe('function');
    expect(typeof mockAiClient.callAi).toBe('function');

    // Action 3のプロンプトモジュール確認
    expect(buildAction03Prompt).toBeDefined();
    expect(typeof buildAction03Prompt).toBe('function');
    expect(ACTION_03_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_03_PROMPT_VERSION).toBe('string');
    expect(ACTION_03_PROMPT_VERSION.length).toBeGreaterThan(0);

    // buildAction03Promptにテスト用日報データを入力
    const action03Prompt = buildAction03Prompt(submittedReports);
    expect(action03Prompt).toBeDefined();
    expect(action03Prompt.length).toBeGreaterThan(0);

    // fakeなAIクライアントの応答として課題オブジェクト配列を返す
    const aiResponse = await mockAiClient.callAi(action03Prompt);
    expect(aiResponse).toBeDefined();
    expect(aiResponse.extractedIssues).toBeDefined();
    expect(Array.isArray(aiResponse.extractedIssues)).toBe(true);

    // エージェント実行
    const agentOutput = await runTx11Imp1Agent(agentInput, mockAiClient);

    // エージェントが返した課題抽出結果を検証：提出日報5件から計8個の個別課題が抽出されたことを確認
    expect(agentOutput).toBeDefined();
    expect(agentOutput.prioritizedIssues).toBeDefined();
    expect(Array.isArray(agentOutput.prioritizedIssues)).toBe(true);
    expect(agentOutput.prioritizedIssues.length).toBe(8);

    // 日報あたり平均1.6課題を確認
    const averageIssuesPerReport = agentOutput.prioritizedIssues.length / submittedReports.length;
    expect(averageIssuesPerReport).toBe(1.6);

    // 各抽出課題について、抽出元となった日報IDと課題テキストが正確に記録されていることを確認
    const extractedIssueIds = new Set<string>();
    agentOutput.prioritizedIssues.forEach((issue) => {
      expect(issue).toHaveProperty('issueId');
      expect(issue).toHaveProperty('issueText');
      expect(issue).toHaveProperty('sourceReportId');
      expect(issue.issueId).toBeDefined();
      expect(issue.issueId.length).toBeGreaterThan(0);
      expect(issue.issueText).toBeDefined();
      expect(issue.issueText.length).toBeGreaterThan(0);
      expect(issue.sourceReportId).toBeDefined();
      expect(submittedReports.some((r) => r.reportId === issue.sourceReportId)).toBe(true);
      extractedIssueIds.add(issue.issueId);
    });

    // 重複なしを確認
    expect(extractedIssueIds.size).toBe(8);

    // ページネーション確認（すべての課題が返されている）
    const expectedIssueIds = [
      'issue-001',
      'issue-002',
      'issue-003',
      'issue-004',
      'issue-005',
      'issue-006',
      'issue-007',
      'issue-008',
    ];
    expectedIssueIds.forEach((expectedId) => {
      expect(extractedIssueIds.has(expectedId)).toBe(true);
    });

    // 抽出元日報IDと課題テキストが正確に紐付けられていることを確認
    const issue001 = agentOutput.prioritizedIssues.find((i) => i.issueId === 'issue-001');
    expect(issue001).toBeDefined();
    expect(issue001?.issueText).toBe('DBコネクション数が限界に達している');
    expect(issue001?.sourceReportId).toBe('report-001');

    const issue003 = agentOutput.prioritizedIssues.find((i) => i.issueId === 'issue-003');
    expect(issue003).toBeDefined();
    expect(issue003?.issueText).toBe('APIレスポンス時間が3秒を超えている');
    expect(issue003?.sourceReportId).toBe('report-002');

    const issue008 = agentOutput.prioritizedIssues.find((i) => i.issueId === 'issue-008');
    expect(issue008).toBeDefined();
    expect(issue008?.issueText).toBe('リソース不足により納期が危ぶまれている');
    expect(issue008?.sourceReportId).toBe('report-005');

    // 提出状況の検証
    const submissionStatus: SubmissionStatusSummary = agentOutput.submissionStatus;
    expect(submissionStatus).toBeDefined();
    expect(submissionStatus.totalMembers).toBe(5);
    expect(submissionStatus.submittedCount).toBe(5);
    expect(submissionStatus.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(submissionStatus.unsubmittedMembers)).toBe(true);
    expect(submissionStatus.unsubmittedMembers.length).toBe(0);

    // 通知送信の検証
    expect(agentOutput.notificationsSent).toBeDefined();
    expect(Array.isArray(agentOutput.notificationsSent)).toBe(true);

    // 部長向けサマリーメール送信の検証
    expect(agentOutput.summaryEmailSent).toBeDefined();
    expect(typeof agentOutput.summaryEmailSent).toBe('boolean');
  });
});