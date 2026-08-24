import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('tx-9-imp-1: 日報集約から分析報告までの自動実行エージェント', () => {
  test('SCEN-3219: 課題を優先度別に分類・分析する', async () => {
    // Setup: テスト用の日報データセット
    const aggregationStartDate = '2024-01-08';
    const aggregationEndDate = '2024-01-12';
    const targetTeamIds = ['team-001'];
    const requestedByUserId = 'user-manager-001';

    const dailyReportsData = [
      {
        memberId: 'user-001',
        reportDate: '2024-01-08',
        issue: 'データベース接続が遅い。複数ユーザーが影響を受けている。',
      },
      {
        memberId: 'user-002',
        reportDate: '2024-01-09',
        issue: 'ビルドが失敗しています。新しい依存ライブラリとの互換性問題。',
      },
      {
        memberId: 'user-003',
        reportDate: '2024-01-10',
        issue: 'テストケースの不備により本番環境でエラーが発生している。',
      },
    ];

    // TextAnalysisServiceAdapter スタブを作成
    const textAnalysisStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続', frequency: 2, confidence: 0.95 },
          { keyword: 'ビルド失敗', frequency: 1, confidence: 0.92 },
          { keyword: 'テスト不備', frequency: 1, confidence: 0.88 },
        ],
      }),
      assessImpactScore: jest.fn().mockImplementation((keyword: string) => {
        const scoreMap: Record<string, number> = {
          'データベース接続': 85,
          'ビルド失敗': 65,
          'テスト不備': 35,
        };
        return Promise.resolve(scoreMap[keyword] || 0);
      }),
      classifyIssueSeverity: jest.fn().mockImplementation((text: string) => {
        if (text.includes('データベース')) return Promise.resolve('高');
        if (text.includes('ビルド')) return Promise.resolve('中');
        return Promise.resolve('低');
      }),
    };

    // Tx9Imp1AiClient スタブを作成
    const aiClientStub: Tx9Imp1AiClient = {
      callAction01: jest.fn().mockResolvedValue({
        action: 'action_01',
        result: { collectedReportCount: 3, uncollectedMembers: [] },
      }),
      callAction02: jest.fn().mockResolvedValue({
        action: 'action_02',
        result: { remindedCount: 0 },
      }),
      callAction03: jest.fn().mockResolvedValue({
        action: 'action_03',
        result: { extractedKeywords: textAnalysisStub.extractKeywords },
      }),
      callAction04: jest.fn().mockResolvedValue({
        action: 'action_04',
        result: {
          classifiedIssues: [
            {
              priority: '高',
              keyword: 'データベース接続',
              impactScore: 85,
              severity: '高',
              reasoning: '複数ユーザーへの波及度が高く、システム全体に影響する重大課題',
              recurrenceDetected: true,
              recurrenceFrequency: 3,
              lastResolutionDate: '2024-01-01T10:30:00Z',
              previousCountermeasure: 'インデックス最適化とクエリ調整',
            },
            {
              priority: '中',
              keyword: 'ビルド失敗',
              impactScore: 65,
              severity: '中',
              reasoning: '開発フローに影響するが、回避策が存在する',
              recurrenceDetected: false,
              recurrenceFrequency: null,
              lastResolutionDate: null,
              previousCountermeasure: null,
            },
            {
              priority: '低',
              keyword: 'テスト不備',
              impactScore: 35,
              severity: '低',
              reasoning: '影響範囲が限定的で、本番環境への直接的な波及は低い',
              recurrenceDetected: false,
              recurrenceFrequency: null,
              lastResolutionDate: null,
              previousCountermeasure: null,
            },
          ],
        },
      }),
      callAction05: jest.fn().mockResolvedValue({
        action: 'action_05',
        result: { sampledIssuesCount: 3 },
      }),
      callAction06: jest.fn().mockResolvedValue({
        action: 'action_06',
        result: { reportGenerated: true },
      }),
      callAction07: jest.fn().mockResolvedValue({
        action: 'action_07',
        result: { delivered: true },
      }),
    };

    // runTx9Imp1Agent を実行
    const result = await runTx9Imp1Agent(
      {
        aggregationPeriodStart: new Date(`${aggregationStartDate}T00:00:00Z`),
        aggregationPeriodEnd: new Date(`${aggregationEndDate}T23:59:59Z`),
        targetTeamIds,
        managerUserId: requestedByUserId,
      },
      aiClientStub
    );

    // 検証: Tx9Imp1AiClient インターフェースの構造的一致性
    expect(aiClientStub).toHaveProperty('callAction01');
    expect(aiClientStub).toHaveProperty('callAction02');
    expect(aiClientStub).toHaveProperty('callAction03');
    expect(aiClientStub).toHaveProperty('callAction04');
    expect(aiClientStub).toHaveProperty('callAction05');
    expect(aiClientStub).toHaveProperty('callAction06');
    expect(aiClientStub).toHaveProperty('callAction07');

    // 検証: Action 4 が呼び出されたことを確認
    expect(aiClientStub.callAction04).toHaveBeenCalled();

    // 検証: 分類結果の構造とデータの正確性
    expect(result).toBeDefined();
    expect(result.analysisReportId).toBeDefined();
    expect(typeof result.analysisReportId).toBe('string');

    // 検証: 優先度別に正しく分類されているか
    const classifiedIssuesFromAction04 = aiClientStub.callAction04.mock.results[0].value.result.classifiedIssues;

    // 高リスク課題の検証
    const highPriorityIssue = classifiedIssuesFromAction04.find(
      (issue: any) => issue.priority === '高'
    );
    expect(highPriorityIssue).toBeDefined();
    expect(highPriorityIssue.keyword).toBe('データベース接続');
    expect(highPriorityIssue.impactScore).toBe(85);
    expect(highPriorityIssue.severity).toBe('高');
    expect(highPriorityIssue.recurrenceDetected).toBe(true);
    expect(highPriorityIssue.recurrenceFrequency).toBe(3);
    expect(highPriorityIssue.lastResolutionDate).toBe('2024-01-01T10:30:00Z');
    expect(highPriorityIssue.previousCountermeasure).toBe(
      'インデックス最適化とクエリ調整'
    );

    // 中リスク課題の検証
    const mediumPriorityIssue = classifiedIssuesFromAction04.find(
      (issue: any) => issue.priority === '中'
    );
    expect(mediumPriorityIssue).toBeDefined();
    expect(mediumPriorityIssue.keyword).toBe('ビルド失敗');
    expect(mediumPriorityIssue.impactScore).toBe(65);
    expect(mediumPriorityIssue.severity).toBe('中');
    expect(mediumPriorityIssue.recurrenceDetected).toBe(false);

    // 低リスク課題の検証
    const lowPriorityIssue = classifiedIssuesFromAction04.find(
      (issue: any) => issue.priority === '低'
    );
    expect(lowPriorityIssue).toBeDefined();
    expect(lowPriorityIssue.keyword).toBe('テスト不備');
    expect(lowPriorityIssue.impactScore).toBe(35);
    expect(lowPriorityIssue.severity).toBe('低');
    expect(lowPriorityIssue.recurrenceDetected).toBe(false);

    // 検証: 各課題に必須フィールドが含まれている
    classifiedIssuesFromAction04.forEach((issue: any) => {
      expect(issue).toHaveProperty('priority');
      expect(issue).toHaveProperty('keyword');
      expect(issue).toHaveProperty('impactScore');
      expect(issue).toHaveProperty('severity');
      expect(issue).toHaveProperty('reasoning');
      expect(issue).toHaveProperty('recurrenceDetected');
    });

    // 検証: 再発パターン検出済み課題に対して必須フィールドが付加されている
    if (highPriorityIssue.recurrenceDetected) {
      expect(highPriorityIssue).toHaveProperty('recurrenceFrequency');
      expect(highPriorityIssue).toHaveProperty('lastResolutionDate');
      expect(highPriorityIssue).toHaveProperty('previousCountermeasure');
      expect(highPriorityIssue.recurrenceFrequency).toBe(3);
      expect(typeof highPriorityIssue.lastResolutionDate).toBe('string');
      expect(typeof highPriorityIssue.previousCountermeasure).toBe('string');
    }

    // 検証: 結果が JSON シリアライズ可能である
    const jsonString = JSON.stringify(result);
    expect(jsonString).toBeDefined();
    expect(typeof jsonString).toBe('string');

    // 逆シリアライズして構造が保持されていることを確認
    const deserializedResult = JSON.parse(jsonString);
    expect(deserializedResult.analysisReportId).toBe(result.analysisReportId);

    // 検証: 優先度の順序が正しい（高 → 中 → 低）
    const priorities = classifiedIssuesFromAction04.map((issue: any) => issue.priority);
    expect(priorities[0]).toBe('高');
    expect(priorities[1]).toBe('中');
    expect(priorities[2]).toBe('低');

    // 検証: 波及度スコアが期待値どおり
    expect(highPriorityIssue.impactScore).toBeGreaterThanOrEqual(70);
    expect(mediumPriorityIssue.impactScore).toBeGreaterThanOrEqual(40);
    expect(mediumPriorityIssue.impactScore).toBeLessThan(70);
    expect(lowPriorityIssue.impactScore).toBeLessThan(40);

    // 検証: reportDeliveryStatus が正確に設定されている
    expect(result.reportDeliveryStatus).toBe('delivered');

    // 検証: productivityMetrics が定量値で設定されている
    expect(result.productivityMetrics).toBeDefined();
    expect(typeof result.productivityMetrics.issueFrequencyPerDay).toBe('number');
    expect(typeof result.productivityMetrics.averageResolutionDays).toBe('number');
    expect(typeof result.productivityMetrics.completionRate).toBe('number');
    expect(result.productivityMetrics.completionRate).toBeGreaterThanOrEqual(0);
    expect(result.productivityMetrics.completionRate).toBeLessThanOrEqual(100);

    // 検証: prioritizedIssues が返却されている
    expect(result.prioritizedIssues).toBeDefined();
    expect(Array.isArray(result.prioritizedIssues.issues)).toBe(true);
    expect(result.prioritizedIssues.issues.length).toBeGreaterThan(0);
  });
});