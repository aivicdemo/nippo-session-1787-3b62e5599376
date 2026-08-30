import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4AgentExecutionContext, Tx4MorningBriefingMaterial } from '../../src/agents/tx-4-imp-1/types';

describe('Tx4Imp1Agent - ダッシュボード分析から課題指示までの自動実行', () => {
  test('SCEN-012: 毎朝、リアルタイム進捗データを自動集約し、報告済み日報から課題を抽出・優先順位付けして、対応方針案を作成し、部長向け朝会資料として提示する', async () => {
    // 入力データの準備
    const executionTimestamp = new Date('2026-08-20T09:00:00Z');
    const targetTeamIds = ['team-001', 'team-002'];
    const aggregationPeriodStartDate = new Date('2026-08-19');
    const aggregationPeriodEndDate = new Date('2026-08-19');

    const input: Tx4AgentExecutionContext = {
      executionTimestamp,
      targetTeamIds,
      aggregationPeriodStartDate,
      aggregationPeriodEndDate,
    };

    // スタブの準備: aggregateReportsByPeriod
    const aggregatedReports = [
      {
        memberId: 'eng-001',
        memberName: 'エンジニアA',
        yesterday: 'DB最適化タスク完了',
        today: 'API開発継続',
        issue: 'ビルドエラーが頻発',
        submittedAt: new Date('2026-08-20T08:30:00Z'),
      },
      {
        memberId: 'eng-002',
        memberName: 'エンジニアB',
        yesterday: 'テスト環境構築完了',
        today: 'ユニットテスト実装',
        issue: 'テスト失敗が多い',
        submittedAt: new Date('2026-08-20T08:45:00Z'),
      },
      {
        memberId: 'eng-003',
        memberName: 'エンジニアC',
        yesterday: 'ドキュメント作成',
        today: 'コードレビュー実施',
        issue: 'ビルドエラーと依存関係エラー',
        submittedAt: new Date('2026-08-20T08:50:00Z'),
      },
    ];

    // スタブの準備: extractAndRankIssuesFromReports
    const extractedIssues = [
      { keyword: 'ビルドエラー', frequency: 2 },
      { keyword: 'テスト失敗', frequency: 1 },
      { keyword: '依存関係エラー', frequency: 1 },
      { keyword: 'パフォーマンス問題', frequency: 0 },
      { keyword: 'セキュリティ脆弱性', frequency: 0 },
    ];

    // スタブの準備: calculatePriorityScoreForIssue
    // 各課題のスコア計算ロジック（出現回数と影響度に基づく）
    const priorityScoresMap: { [key: string]: number } = {
      'ビルドエラー': 85, // 赤（75以上）
      'テスト失敗': 65, // 黄（50～74）
      '依存関係エラー': 58, // 黄（50～74）
      'パフォーマンス問題': 40, // 緑（49以下）
      'セキュリティ脆弱性': 35, // 緑（49以下）
    };

    // モック用のAIクライアント
    const mockAiClient = {
      aggregateReportsByPeriod: jest.fn().mockResolvedValue(aggregatedReports),
      extractAndRankIssuesFromReports: jest.fn().mockResolvedValue(extractedIssues),
      calculatePriorityScoreForIssue: jest.fn().mockImplementation((issue) => {
        const score = priorityScoresMap[issue.keyword] || 0;
        let color: 'red' | 'yellow' | 'green';
        if (score >= 75) {
          color = 'red';
        } else if (score >= 50) {
          color = 'yellow';
        } else {
          color = 'green';
        }
        return Promise.resolve({ issue: issue.keyword, score, color });
      }),
      generateAndSendManagerConfirmationEmail: jest.fn().mockResolvedValue({
        status: 'SENT',
        sentAt: new Date('2026-08-20T09:05:00Z'),
        errorMessage: null,
      }),
      prepareDashboardData: jest.fn().mockResolvedValue({
        totalReports: 3,
        submittedCount: 3,
        unsubmittedMembers: [],
      }),
    };

    // runTx4Imp1Agent関数を呼び出す
    const result = await runTx4Imp1Agent(input, mockAiClient);

    // 出力型の検証
    expect(result).toBeDefined();
    expect(result.briefingId).toBeTruthy();
    expect(typeof result.briefingId).toBe('string');

    // generatedAtが実行時刻以降であることを検証
    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt.getTime()).toBeGreaterThanOrEqual(executionTimestamp.getTime());

    // prioritizedIssueListが5件の課題を優先度スコア降順で含むことを検証
    expect(result.prioritizedIssueList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);
    expect(result.prioritizedIssueList.length).toBe(5);

    // 課題が優先度スコア降順であることを検証
    for (let i = 0; i < result.prioritizedIssueList.length - 1; i++) {
      expect(result.prioritizedIssueList[i].priorityScore).toBeGreaterThanOrEqual(
        result.prioritizedIssueList[i + 1].priorityScore
      );
    }

    // 各課題に色が付与されていることを検証
    const expectedColors: { [key: string]: 'red' | 'yellow' | 'green' } = {
      'ビルドエラー': 'red',
      'テスト失敗': 'yellow',
      '依存関係エラー': 'yellow',
      'パフォーマンス問題': 'green',
      'セキュリティ脆弱性': 'green',
    };

    result.prioritizedIssueList.forEach((issue) => {
      expect(['red', 'yellow', 'green']).toContain(issue.color);
      expect(issue.color).toBe(expectedColors[issue.keyword] || 'green');
    });

    // countermeasureProposalsが5件の対応方針案を含み、各案に必須フィールドが設定されていることを検証
    expect(result.countermeasureProposals).toBeDefined();
    expect(Array.isArray(result.countermeasureProposals)).toBe(true);
    expect(result.countermeasureProposals.length).toBe(5);

    result.countermeasureProposals.forEach((proposal) => {
      expect(proposal.issueId).toBeTruthy();
      expect(typeof proposal.issueId).toBe('string');
      expect(proposal.proposedAction).toBeTruthy();
      expect(typeof proposal.proposedAction).toBe('string');
      expect(proposal.assignedTeamId).toBeTruthy();
      expect(typeof proposal.assignedTeamId).toBe('string');
      expect(proposal.targetCompletionDate).toBeDefined();
      expect(proposal.targetCompletionDate instanceof Date).toBe(true);
    });

    // submissionStatusSummaryが期待値を返すことを検証
    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.submissionStatusSummary.totalMemberCount).toBe(3);
    expect(result.submissionStatusSummary.submittedCount).toBe(3);
    expect(result.submissionStatusSummary.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(result.submissionStatusSummary.unsubmittedMembers)).toBe(true);
    expect(result.submissionStatusSummary.unsubmittedMembers.length).toBe(0);

    // managerNotificationStatusが'送信完了'を返すことを検証
    expect(result.managerNotificationStatus).toBeDefined();
    expect(result.managerNotificationStatus.status).toBe('SENT');
    expect(result.managerNotificationStatus.sentAt).toBeDefined();
    expect(result.managerNotificationStatus.sentAt instanceof Date).toBe(true);
    expect(result.managerNotificationStatus.errorMessage).toBeNull();

    // スタブが期待された順序で呼び出されたことを検証
    expect(mockAiClient.aggregateReportsByPeriod).toHaveBeenCalledWith(
      aggregationPeriodStartDate,
      aggregationPeriodEndDate,
      targetTeamIds
    );
    expect(mockAiClient.extractAndRankIssuesFromReports).toHaveBeenCalledWith(aggregatedReports);
    expect(mockAiClient.calculatePriorityScoreForIssue).toHaveBeenCalledTimes(5);
    expect(mockAiClient.generateAndSendManagerConfirmationEmail).toHaveBeenCalled();
  });
});