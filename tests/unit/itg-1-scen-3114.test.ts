import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('tx-3-imp-1: 日報集約から優先度別課題一覧提示までの自動判定・配信', () => {
  test('SCEN-3114: Action 1が集約済み日報から課題キーワードを正確に抽出し、TextAnalysisServiceAdapterが日報件数分呼び出される', async () => {
    // テストデータ: 集約済み日報3件（各日報に複数の課題記述を含む）
    const aggregatedReportIds = ['report-001', 'report-002', 'report-003'];
    const reportContents = [
      'システム障害が発生した。データベース接続エラーにより、朝8時から11時まで業務が停止した。納期遅延のリスクあり。',
      'APIサーバーのメモリリークが検出された。品質問題として対応が必要。同様の問題が先月も発生していた。',
      '納期遅延が確定した。クライアント要件の変更が原因。システム障害の復旧に時間を要した。品質テストも遅延中。',
    ];

    // モック: TextAnalysisServiceAdapter#extractKeywords
    const mockExtractKeywords = jest.fn()
      .mockResolvedValueOnce({
        keywords: [
          { keyword: 'システム障害', frequency: 1 },
          { keyword: 'データベース接続エラー', frequency: 1 },
          { keyword: '納期遅延', frequency: 1 },
        ],
      })
      .mockResolvedValueOnce({
        keywords: [
          { keyword: 'APIサーバー', frequency: 1 },
          { keyword: 'メモリリーク', frequency: 1 },
          { keyword: '品質問題', frequency: 1 },
        ],
      })
      .mockResolvedValueOnce({
        keywords: [
          { keyword: '納期遅延', frequency: 2 },
          { keyword: 'クライアント要件変更', frequency: 1 },
          { keyword: 'システム障害', frequency: 1 },
          { keyword: '品質テスト遅延', frequency: 1 },
        ],
      });

    // モック: TextAnalysisServiceAdapter#assessImpactScore
    const mockAssessImpactScore = jest.fn()
      .mockResolvedValue({ impactScore: 75 });

    // モック: TextAnalysisServiceAdapter#classifyIssueSeverity
    const mockClassifyIssueSeverity = jest.fn()
      .mockResolvedValue({ severity: 'high' });

    // Tx3Imp1AiClient の実装
    const mockAiClient: Tx3Imp1AiClient = {
      extractKeywords: mockExtractKeywords,
      assessImpactScore: mockAssessImpactScore,
      classifyIssueSeverity: mockClassifyIssueSeverity,
    };

    // エージェント入力
    const input = {
      aggregatedReportIds,
      analysisStartDate: '2024-01-15T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      managerUserId: 'manager-user-001',
      priorityThresholdScore: 70,
    };

    // エージェント実行
    const result = await runTx3Imp1Agent(input, mockAiClient);

    // 検証1: TextAnalysisServiceAdapter#extractKeywordsが日報件数分（3回）正確に呼び出されたか
    expect(mockExtractKeywords).toHaveBeenCalledTimes(3);

    // 検証2: extractKeywordsの各呼び出しが正しい日報テキストを受け取ったか
    expect(mockExtractKeywords).toHaveBeenNthCalledWith(1, reportContents[0]);
    expect(mockExtractKeywords).toHaveBeenNthCalledWith(2, reportContents[1]);
    expect(mockExtractKeywords).toHaveBeenNthCalledWith(3, reportContents[2]);

    // 検証3: 抽出されたキーワードが5個以上の異なるキーワードを含むか
    // 期待される抽出キーワード: システム障害、データベース接続エラー、納期遅延、APIサーバー、メモリリーク、品質問題、クライアント要件変更、品質テスト遅延
    const expectedKeywordCount = 8;
    expect(result.prioritizedIssuesList).toBeDefined();
    expect(result.prioritizedIssuesList.length).toBeGreaterThanOrEqual(5);

    // 検証4: 抽出されたキーワードが元の日報テキストに実際に含まれているか
    result.prioritizedIssuesList.forEach((issue) => {
      const isFoundInReports = reportContents.some((content) =>
        content.includes(issue.keyword) || 
        content.includes(issue.title)
      );
      expect(isFoundInReports).toBe(true);
    });

    // 検証5: 抽出結果が構造化データとして正常に返却されているか
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);

    // 検証6: 抽出課題件数がカウントされているか
    expect(result.extractedIssuesCount).toBeGreaterThanOrEqual(5);

    // 検証7: 優先度付きリストが返却されているか
    expect(result.prioritizedIssuesList).toBeInstanceOf(Array);
    result.prioritizedIssuesList.forEach((issue) => {
      expect(issue).toHaveProperty('keyword');
      expect(issue).toHaveProperty('priority');
      expect(['high', 'medium', 'low']).toContain(issue.priority);
    });

    // 検証8: 完了時刻がISO 8601形式で記録されているか
    expect(result.completionTimestamp).toBeDefined();
    const completionDate = new Date(result.completionTimestamp);
    expect(completionDate.getTime()).toBeGreaterThan(0);

    // 検証9: メール送信ステータスが設定されているか
    expect(result.emailSendStatus).toBeDefined();
    expect(['success', 'failed', 'pending']).toContain(result.emailSendStatus);

    // 検証10: Action 1の実行が完了後、後続のAction 2へ正確に引き継がれる状態にある
    // (prioritizedIssuesListが存在し、各要素がpriority情報を持つ)
    expect(result.prioritizedIssuesList.length).toBe(expectedKeywordCount);
  });
});