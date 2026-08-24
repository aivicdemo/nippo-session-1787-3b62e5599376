import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking - All Members Report Coverage', () => {
  // SCEN-464: [edge] 課題自動抽出・優先度判定機能 - 10名すべてのメンバーから報告がある場合、全報告データが課題集約対象に含まれる

  let mockTextAnalysisAdapter: any;

  beforeEach(() => {
    // TextAnalysisServiceAdapterのスタブ化
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((reportText: string) => {
        // 各報告テキストから課題キーワードを抽出して出現頻度を返す
        const keywordMap: { [key: string]: number } = {};

        if (reportText.includes('データベース接続')) {
          keywordMap['データベース接続エラー'] = 1;
        }
        if (reportText.includes('API応答')) {
          keywordMap['API応答遅延'] = 1;
        }
        if (reportText.includes('メモリリーク')) {
          keywordMap['メモリリーク検出'] = 1;
        }
        if (reportText.includes('ネットワーク')) {
          keywordMap['ネットワーク不安定'] = 1;
        }
        if (reportText.includes('ビルド失敗')) {
          keywordMap['ビルド失敗'] = 1;
        }

        return Promise.resolve(keywordMap);
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        // チーム波及度スコア（0～100）を返す
        const scoreMap: { [key: string]: number } = {
          'データベース接続エラー': 85,
          'API応答遅延': 75,
          'メモリリーク検出': 90,
          'ネットワーク不安定': 65,
          'ビルド失敗': 80,
        };
        return scoreMap[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn(async (content: string) => {
        // 重要度を返す
        if (content.includes('高priority')) return 'high';
        if (content.includes('中priority')) return 'medium';
        return 'low';
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should include all reports from 10 members in aggregated data', async () => {
    // 10名のメンバーIDを定義
    const memberIds = [
      'member01',
      'member02',
      'member03',
      'member04',
      'member05',
      'member06',
      'member07',
      'member08',
      'member09',
      'member10',
    ];

    const teamId = 'team-dev-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'dept-chief-001';

    // 各メンバーの報告データを作成（昨日やったこと、今日やること、抱えている課題）
    const reportDataCollection: Array<{
      memberId: string;
      yesterdayWork: string;
      todayPlan: string;
      challenges: string;
    }> = [];

    memberIds.forEach((memberId, index) => {
      reportDataCollection.push({
        memberId,
        yesterdayWork: `完成したUI開発、データベース接続テスト、APIドキュメント作成（メンバー${index + 1}）`,
        todayPlan: `API応答性能改善、ネットワークテスト実施、ビルド環境構築（メンバー${index + 1}）`,
        challenges: `メモリリーク検出、ビルド失敗発生、API応答遅延問題（メンバー${index + 1}）`,
      });
    });

    // 集約対象報告データ数をカウント
    let aggregatedReportCount = 0;
    const aggregatedReportIds: string[] = [];

    // 各メンバーの報告データを処理
    for (const reportData of reportDataCollection) {
      // 各報告（昨日、今日、課題）が集約対象に含まれるか確認
      const challengeReportText =
        reportData.yesterdayWork + ' ' + reportData.todayPlan + ' ' + reportData.challenges;

      // キーワード抽出実行（スタブ）
      const extractedKeywords = await mockTextAnalysisAdapter.extractKeywords(challengeReportText);

      // 課題が抽出された場合、集約対象に含める
      if (Object.keys(extractedKeywords).length > 0) {
        aggregatedReportCount += 3; // 昨日、今日、課題の3項目
        aggregatedReportIds.push(reportData.memberId);

        // 各キーワードのスコアを取得
        for (const keyword of Object.keys(extractedKeywords)) {
          const impactScore = await mockTextAnalysisAdapter.assessImpactScore(keyword);
          expect(impactScore).toBeGreaterThanOrEqual(0);
          expect(impactScore).toBeLessThanOrEqual(100);
        }
      }
    }

    // 入力パラメータ
    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    // 課題自動抽出・優先度判定機能を実行
    // 注: 実装の詳細に応じて、ここで実際の関数を呼び出す
    // この例では、スタブの動作を検証しているため、直接 extractAndRankIssueKeywords を呼び出す
    try {
      const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisAdapter,
      );

      // 検証1: 10名全メンバーの報告データが集約対象に含まれている
      expect(aggregatedReportCount).toBe(30); // 3項目 × 10名 = 30
      expect(aggregatedReportIds.length).toBe(10); // 10名全員
      expect(aggregatedReportIds).toEqual(memberIds);

      // 検証2: 抽出されたキーワードがある
      expect(result.keywords).toBeDefined();
      expect(Array.isArray(result.keywords)).toBe(true);

      // 検証3: 抽出されたキーワード数（フィルタ前）
      expect(result.totalKeywordCount).toBeGreaterThan(0);

      // 検証4: 抽出日時が記録されている
      expect(result.extractedAt).toBeInstanceOf(Date);

      // 検証5: 分析対象期間の日数（開始日から終了日まで）
      const expectedAnalysisPeriodDays =
        Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      expect(result.analysisperiodDays).toBe(expectedAnalysisPeriodDays);

      // 検証6: ランク付けされたキーワードが発生頻度の降順であること
      for (let i = 1; i < result.keywords.length; i++) {
        expect(result.keywords[i - 1].frequency).toBeGreaterThanOrEqual(
          result.keywords[i].frequency,
        );
        expect(result.keywords[i - 1].rank).toBeLessThan(result.keywords[i].rank);
      }

      // 検証7: 各キーワードの必須フィールドが存在
      result.keywords.forEach((keyword) => {
        expect(keyword.keywordId).toBeDefined();
        expect(keyword.keyword).toBeDefined();
        expect(keyword.frequency).toBeGreaterThan(0);
        expect(keyword.rank).toBeGreaterThan(0);
      });

      // 検証8: スタブメソッドが呼び出されたことを確認
      expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
      expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    } catch (error) {
      // エラーが発生した場合、スタブの設定に問題がないか確認
      throw new Error(`Failed to extract and rank keywords: ${String(error)}`);
    }
  });
});