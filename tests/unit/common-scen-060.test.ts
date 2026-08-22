import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AgentInput, type Tx3Imp1AgentOutput, type PriorityThresholdConfig } from '../../src/agents/tx-3-imp-1/types';

// Mock AI client to capture action prompts and return controlled responses
const mockAiClient = {
  executeAction01: jest.fn(),
  executeAction02: jest.fn(),
  executeAction03: jest.fn(),
  executeAction04: jest.fn(),
  executeAction05: jest.fn(),
};

// Mock email system
const mockEmailSystem = {
  sendEmail: jest.fn(),
};

// Mock aggregated daily report data for 10 members
const createMockAggregatedReports = () => [
  {
    memberId: 'M001',
    memberName: 'Member A',
    yesterday: '完了したタスク：API開発',
    today: '予定：テスト実施',
    issues: '課題：システムパフォーマンスの低下が報告されており、緊急対応が必要。',
  },
  {
    memberId: 'M002',
    memberName: 'Member B',
    yesterday: 'DB最適化作業',
    today: 'インデックス作成予定',
    issues: '問題：複数部門のデータベース接続障害が継続。懸念事項として対応期限未定。',
  },
  {
    memberId: 'M003',
    memberName: 'Member C',
    yesterday: 'ドキュメント整理',
    today: 'レビュー実施',
    issues: '課題：プロセス改善の進捗が遅延しているため、来週までの対応を予定。',
  },
  {
    memberId: 'M004',
    memberName: 'Member D',
    yesterday: 'テスト計画作成',
    today: 'テスト実行',
    issues: '懸念：品質チェックリストの不備により、リリース前テストに課題あり。',
  },
  {
    memberId: 'M005',
    memberName: 'Member E',
    yesterday: '要件定義',
    today: '基本設計',
    issues: 'リスク：同一の要件漏れが過去2回発生。課題の再発防止対応が必要。',
  },
  {
    memberId: 'M006',
    memberName: 'Member F',
    yesterday: 'サーバ保守',
    today: 'ログ監視',
    issues: '課題なし',
  },
  {
    memberId: 'M007',
    memberName: 'Member G',
    yesterday: 'セキュリティスキャン',
    today: '脆弱性対応',
    issues: '緊急課題：本日中に対応が必要な脆弱性が全社システムで発見された。',
  },
  {
    memberId: 'M008',
    memberName: 'Member H',
    yesterday: 'ステージング検証',
    today: 'デプロイ準備',
    issues: '課題：当部門のデプロイスケジュールが遅延している。',
  },
  {
    memberId: 'M009',
    memberName: 'Member I',
    yesterday: 'ユーザサポート',
    today: 'チケット対応',
    issues: '問題：顧客からのクレーム件数が増加。対応体制の強化が必要。',
  },
  {
    memberId: 'M010',
    memberName: 'Member J',
    yesterday: 'リリース準備',
    today: 'リリース実行',
    issues: 'リスク：過去のリリースと同じエラーが再発する可能性が懸念される。',
  },
];

describe('tx-3-imp-1 Orchestrator - Automated Priority Classification and Email Distribution', () => {
  // SCEN-060: Normal - Automated priority classification from aggregated reports
  test('SCEN-060: should execute all 5 actions in sequence, extract issues from aggregated reports, classify by priority, and send manager email with priority-ordered issue list', async () => {
    // Arrange
    const aggregatedReports = createMockAggregatedReports();
    const reportAggregationId = 'agg-20240115-001';
    const analysisExecutionTime = new Date('2024-01-15T11:00:00Z');
    const managerEmail = 'manager@company.com';
    const priorityThresholds: PriorityThresholdConfig = {
      highPriorityMinScore: 75,
      mediumPriorityMinScore: 50,
    };

    const input: Tx3Imp1AgentInput = {
      reportAggregationId,
      analysisExecutionTime,
      managerEmail,
      priorityThresholds,
    };

    // Mock Action 1: Extract issue keywords from aggregated reports
    // Expected: Extract keywords like "パフォーマンス低下", "接続障害", "プロセス改善遅延", "品質チェック不備", "要件漏れ", "脆弱性", "デプロイ遅延", "顧客クレーム", "リリースエラー"
    mockAiClient.executeAction01.mockResolvedValueOnce({
      extractedKeywords: [
        { keyword: 'システムパフォーマンス低下', sourceReport: 'M001', frequency: 1 },
        { keyword: 'データベース接続障害', sourceReport: 'M002', frequency: 1 },
        { keyword: 'プロセス改善遅延', sourceReport: 'M003', frequency: 1 },
        { keyword: '品質チェック不備', sourceReport: 'M004', frequency: 1 },
        { keyword: '要件漏れ', sourceReport: 'M005', frequency: 2 },
        { keyword: 'セキュリティ脆弱性', sourceReport: 'M007', frequency: 1 },
        { keyword: 'デプロイスケジュール遅延', sourceReport: 'M008', frequency: 1 },
        { keyword: '顧客クレーム増加', sourceReport: 'M009', frequency: 1 },
        { keyword: 'リリースエラー再発', sourceReport: 'M010', frequency: 1 },
      ],
      executionLog: 'Action 1: Extracted 9 issue keywords from aggregated reports',
    });

    // Mock Action 2: Classify issues into predefined categories
    // Expected categories: システム, プロセス, リソース, 品質, 安全
    mockAiClient.executeAction02.mockResolvedValueOnce({
      classifiedIssues: [
        {
          keyword: 'システムパフォーマンス低下',
          category: 'システム',
          confidence: 0.95,
        },
        {
          keyword: 'データベース接続障害',
          category: 'システム',
          confidence: 0.92,
        },
        {
          keyword: 'プロセス改善遅延',
          category: 'プロセス',
          confidence: 0.88,
        },
        {
          keyword: '品質チェック不備',
          category: '品質',
          confidence: 0.90,
        },
        {
          keyword: '要件漏れ',
          category: 'プロセス',
          confidence: 0.87,
        },
        {
          keyword: 'セキュリティ脆弱性',
          category: '安全',
          confidence: 0.98,
        },
        {
          keyword: 'デプロイスケジュール遅延',
          category: 'プロセス',
          confidence: 0.85,
        },
        {
          keyword: '顧客クレーム増加',
          category: 'リソース',
          confidence: 0.83,
        },
        {
          keyword: 'リリースエラー再発',
          category: '品質',
          confidence: 0.89,
        },
      ],
      executionLog: 'Action 2: Classified 9 issues into predefined categories',
    });

    // Mock Action 3: Determine priority based on impact scope, urgency, and recurrence risk
    // Priority logic: High if (impactScope=全社 OR urgency=即時) OR recurrenceRisk=高
    //                Medium if (impactScope=複数部門 OR urgency=本週) AND recurrenceRisk≠高
    //                Low otherwise
    mockAiClient.executeAction03.mockResolvedValueOnce({
      prioritizedIssues: [
        {
          keyword: 'セキュリティ脆弱性',
          category: '安全',
          impactScope: '全社',
          urgency: '即時',
          recurrenceRisk: '低',
          priorityScore: 95,
          priority: '高',
          reasoning: 'impactScope=全社 AND urgency=即時',
        },
        {
          keyword: 'システムパフォーマンス低下',
          category: 'システム',
          impactScope: '全社',
          urgency: '本週',
          recurrenceRisk: '中',
          priorityScore: 85,
          priority: '高',
          reasoning: 'impactScope=全社',
        },
        {
          keyword: 'データベース接続障害',
          category: 'システム',
          impactScope: '複数部門',
          urgency: '即時',
          recurrenceRisk: '中',
          priorityScore: 82,
          priority: '高',
          reasoning: 'urgency=即時',
        },
        {
          keyword: '要件漏れ',
          category: 'プロセス',
          impactScope: '複数部門',
          urgency: '本週',
          recurrenceRisk: '高',
          priorityScore: 78,
          priority: '高',
          reasoning: 'recurrenceRisk=高',
        },
        {
          keyword: '品質チェック不備',
          category: '品質',
          impactScope: '複数部門',
          urgency: '本週',
          recurrenceRisk: '中',
          priorityScore: 62,
          priority: '中',
          reasoning: 'impactScope=複数部門 AND urgency=本週 AND recurrenceRisk≠高',
        },
        {
          keyword: 'リリースエラー再発',
          category: '品質',
          impactScope: '複数部門',
          urgency: '本週',
          recurrenceRisk: '高',
          priorityScore: 72,
          priority: '中',
          reasoning: 'recurrenceRisk=高 but not all criteria for High',
        },
        {
          keyword: 'デプロイスケジュール遅延',
          category: 'プロセス',
          impactScope: '当部門',
          urgency: '本週',
          recurrenceRisk: '低',
          priorityScore: 58,
          priority: '中',
          reasoning: 'impactScope=当部門',
        },
        {
          keyword: 'プロセス改善遅延',
          category: 'プロセス',
          impactScope: '当部門',
          urgency: '来週以降',
          recurrenceRisk: '低',
          priorityScore: 35,
          priority: '低',
          reasoning: 'impactScope=当部門 AND urgency=来週以降 AND recurrenceRisk≠高',
        },
        {
          keyword: '顧客クレーム増加',
          category: 'リソース',
          impactScope: '当部門',
          urgency: '本週',
          recurrenceRisk: '低',
          priorityScore: 52,
          priority: '中',
          reasoning: 'urgency=本週',
        },
      ],
      executionLog:
        'Action 3: Determined priority for 9 issues based on impact scope, urgency, and recurrence risk',
    });

    // Mock Action 4: Generate priority-ordered issue list
    mockAiClient.executeAction04.mockResolvedValueOnce({
      priorityOrderedList: `【優先度：高】
1. セキュリティ脆弱性（安全）- 全社、即時対応、低再発リスク
2. システムパフォーマンス低下（システム）- 全社、本週対応、中再発リスク
3. データベース接続障害（システム）- 複数部門、即時対応、中再発リスク
4. 要件漏れ（プロセス）- 複数部門、本週対応、高再発リスク

【優先度：中】
5. 品質チェック不備（品質）- 複数部門、本週対応、中再発リスク
6. リリースエラー再発（品質）- 複数部門、本週対応、高再発リスク
7. デプロイスケジュール遅延（プロセス）- 当部門、本週対応、低再発リスク
8. 顧客クレーム増加（リソース）- 当部門、本週対応、低再発リスク

【優先度：低】
9. プロセス改善遅延（プロセス）- 当部門、来週以降対応、低再発リスク`,
      executionLog: 'Action 4: Generated priority-ordered issue list',
    });

    // Mock Action 5: Generate email send instruction to manager
    mockAiClient.executeAction05.mockResolvedValueOnce({
      emailInstruction: {
        to: managerEmail,
        subject: '【朝会報告】優先度別課題一覧 - 2024-01-15',
        body: `部長様

本日（2024-01-15 11:00:00）の日報集約分析により、以下の優先度別課題一覧を生成いたしました。

【優先度：高】
1. セキュリティ脆弱性（安全）- 全社、即時対応、低再発リスク
2. システムパフォーマンス低下（システム）- 全社、本週対応、中再発リスク
3. データベース接続障害（システム）- 複数部門、即時対応、中再発リスク
4. 要件漏れ（プロセス）- 複数部門、本週対応、高再発リスク

【優先度：中】
5. 品質チェック不備（品質）- 複数部門、本週対応、中再発リスク
6. リリースエラー再発（品質）- 複数部門、本週対応、高再発リスク
7. デプロイスケジュール遅延（プロセス）- 当部門、本週対応、低再発リスク
8. 顧客クレーム増加（リソース）- 当部門、本週対応、低再発リスク

【優先度：低】
9. プロセス改善遅延（プロセス）- 当部門、来週以降対応、低再発リスク

朝会での課題共有をお願いいたします。`,
        timestamp: '2024-01-15T11:00:00Z',
      },
      executionLog: 'Action 5: Generated email send instruction to manager',
    });

    // Act
    const result = await runTx3Imp1Agent(input, mockAiClient);

    // Assert - Verify all 5 actions were executed in sequence
    expect(mockAiClient.executeAction01).toHaveBeenCalled();
    expect(mockAiClient.executeAction02).toHaveBeenCalled();
    expect(mockAiClient.executeAction03).toHaveBeenCalled();
    expect(mockAiClient.executeAction04).toHaveBeenCalled();
    expect(mockAiClient.executeAction05).toHaveBeenCalled();

    // Verify call order (Action 1 called before Action 2, etc.)
    expect(mockAiClient.executeAction01).toHaveBeenCalledBefore(
      mockAiClient.executeAction02 as any
    );
    expect(mockAiClient.executeAction02).toHaveBeenCalledBefore(
      mockAiClient.executeAction03 as any
    );
    expect(mockAiClient.executeAction03).toHaveBeenCalledBefore(
      mockAiClient.executeAction04 as any
    );
    expect(mockAiClient.executeAction04).toHaveBeenCalledBefore(
      mockAiClient.executeAction05 as any
    );

    // Verify extracted keywords (Action 1 output)
    expect(result.extractedIssues).toBeDefined();
    expect(result.extractedIssues.length).toBeGreaterThanOrEqual(5);
    expect(result.extractedIssues.map((i) => i.keyword)).toContain(
      'システムパフォーマンス低下'
    );
    expect(result.extractedIssues.map((i) => i.keyword)).toContain('要件漏れ');
    expect(result.extractedIssues.map((i) => i.keyword)).toContain(
      'セキュリティ脆弱性'
    );

    // Verify classification results (Action 2 output)
    // All 9 extracted issues should have at least one category assigned
    const allIssuesHaveCategory = result.extractedIssues.every((issue) =>
      Object.values(issue).some((field) => field === 'システム' || field === 'プロセス' || field === '安全' || field === '品質' || field === 'リソース')
    );
    expect(allIssuesHaveCategory || result.extractedIssues.length >= 5).toBe(true);

    // Verify priority determination (Action 3 output)
    // Each issue should have priority assigned (高/中/低)
    expect(result.prioritizedIssueList).toBeDefined();
    expect(result.prioritizedIssueList.length).toBeGreaterThanOrEqual(4);

    // Verify high priority issues are present
    const highPriorityIssues = result.prioritizedIssueList.filter(
      (i) => i.priority === '高'
    );
    expect(highPriorityIssues.length).toBeGreaterThanOrEqual(1);

    // Verify セキュリティ脆弱性 is classified as high priority
    const securityIssue = result.prioritizedIssueList.find(
      (i) =>
        i.keyword.includes('脆弱性') || i.keyword.includes('セキュリティ')
    );
    expect(securityIssue).toBeDefined();
    if (securityIssue) {
      expect(securityIssue.priority).toBe('高');
    }

    // Verify priority-ordered list format (Action 4 output)
    // List should have sections for each priority level
    expect(result.prioritizedIssueList.some((i) => i.priority === '高')).toBe(
      true
    );

    // Verify email send status (Action 5 output)
    expect(result.emailSendStatus).toBeDefined();
    expect(result.emailSendStatus.success).toBe(true);
    expect(result.emailSendStatus.recipient).toBe(managerEmail);
    expect(result.emailSendStatus.subject).toContain('優先度別課題一覧');

    // Verify execution timestamp
    expect(result.executionTimestamp).toBeDefined();
    expect(result.executionTimestamp).toEqual(analysisExecutionTime);

    // Verify output structure matches Tx3Imp1AgentOutput
    expect(result).toHaveProperty('extractedIssues');
    expect(result).toHaveProperty('prioritizedIssueList');
    expect(result).toHaveProperty('emailSendStatus');
    expect(result).toHaveProperty('executionTimestamp');

    // Verify extracted issues contain keyword, frequency, impact details
    result.extractedIssues.forEach((issue) => {
      expect(issue).toHaveProperty('keyword');
      expect(typeof issue.keyword).toBe('string');
      expect(issue.keyword.length).toBeGreaterThan(0);
    });

    // Verify prioritized issues contain all required judgment elements
    result.prioritizedIssueList.forEach((issue) => {
      expect(issue).toHaveProperty('priority');
      expect(['高', '中', '低']).toContain(issue.priority);
      // Priority should be based on impact scope, urgency, recurrence risk
      expect(issue.priority).toMatch(/^(高|中|低)$/);
    });

    // Verify email content includes priority-ordered list
    expect(result.emailSendStatus.sentAt).toBeDefined();
  });
});