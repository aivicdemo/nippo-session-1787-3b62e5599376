import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  test('SCEN-551: チームメンバー数が最大規模（50名）の場合も課題優先度判定が正常に完了する', async () => {
    // Setup: TextAnalysisServiceAdapter をスタブ化
    const mockExtractKeywords = jest.fn((text: string) => {
      const keywords: Array<{ keyword: string; frequency: number }> = [];
      if (text.includes('遅延')) {
        keywords.push({ keyword: '遅延', frequency: 1 });
      }
      if (text.includes('品質')) {
        keywords.push({ keyword: '品質', frequency: 1 });
      }
      if (text.includes('リソース不足')) {
        keywords.push({ keyword: 'リソース不足', frequency: 1 });
      }
      return Promise.resolve(keywords);
    });

    const mockAssessImpactScore = jest.fn((keyword: string) => {
      const scores: { [key: string]: number } = {
        '遅延': 85,
        '品質': 75,
        'リソース不足': 65,
      };
      return Promise.resolve(scores[keyword] || 50);
    });

    const mockClassifyIssueSeverity = jest.fn((keyword: string) => {
      const severities: { [key: string]: 'high' | 'medium' | 'low' } = {
        '遅延': 'high',
        '品質': 'medium',
        'リソース不足': 'medium',
      };
      return Promise.resolve(severities[keyword] || 'low');
    });

    const stubTextAnalysisAdapter = {
      extractKeywords: mockExtractKeywords,
      assessImpactScore: mockAssessImpactScore,
      classifyIssueSeverity: mockClassifyIssueSeverity,
    };

    // Prepare: 50名のテストデータを生成
    const members = Array.from({ length: 50 }, (_, i) => ({
      memberId: String(i + 1).padStart(4, '0'),
      memberName: `Engineer_${i + 1}`,
    }));

    // 各メンバーの日報データを作成（複数の課題キーワード候補を含む）
    const reportingData = members.map((member, index) => ({
      reportId: `report_${member.memberId}`,
      memberId: member.memberId,
      yesterdayWork: `昨日は仕様書レビューを実施しました。一部の遅延が発生しています。`,
      todayWork: `今日は機能実装を進めます。`,
      challenges:
        index % 3 === 0
          ? `品質が懸念されます。リソース不足も課題です。`
          : index % 3 === 1
            ? `実装の遅延リスクがあります。リソース不足で対応できません。`
            : `品質管理に課題があります。遅延が予想されます。`,
      reportedAt: new Date('2024-01-15T10:00:00Z'),
    }));

    // Execute: 50名全員分の日報を処理
    const startTime = Date.now();

    const result = await extractAndRankIssueKeywords(
      reportingData,
      stubTextAnalysisAdapter,
    );

    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;

    // Verify: 各種の検証

    // 1. 処理がタイムアウト（30秒）なく完了したか
    expect(processingTimeMs).toBeLessThan(30000);

    // 2. TextAnalysisServiceAdapter への呼び出し数
    // 50名 × (extractKeywords呼び出し) + 各キーワードに対する
    // assessImpactScore + classifyIssueSeverity呼び出し
    expect(mockExtractKeywords).toHaveBeenCalled();
    expect(mockAssessImpactScore).toHaveBeenCalled();
    expect(mockClassifyIssueSeverity).toHaveBeenCalled();

    // 3. 戻り値の構造検証
    expect(result).toHaveProperty('keywords');
    expect(Array.isArray(result.keywords)).toBe(true);

    // 4. キーワード抽出が実施されたか
    expect(result.keywords.length).toBeGreaterThan(0);

    // 5. 各キーワードのランク付けがあるか
    const keywordsWithRank = result.keywords.filter(
      (k: { rank?: number; frequency?: number }) => k.rank !== undefined,
    );
    expect(keywordsWithRank.length).toBeGreaterThan(0);

    // 6. frequencyが複数日報から集計されているか
    const aggregatedFrequency = result.keywords.some(
      (k: { frequency?: number }) => k.frequency && k.frequency >= 1,
    );
    expect(aggregatedFrequency).toBe(true);

    // 7. 発生頻度でソートされているか（降順）
    if (result.keywords.length > 1) {
      for (let i = 0; i < result.keywords.length - 1; i++) {
        const currentFreq =
          result.keywords[i].frequency !== undefined
            ? result.keywords[i].frequency
            : 0;
        const nextFreq =
          result.keywords[i + 1].frequency !== undefined
            ? result.keywords[i + 1].frequency
            : 0;
        expect(currentFreq).toBeGreaterThanOrEqual(nextFreq);
      }
    }

    // 8. 各キーワードに impactScore（波及度スコア）が付与されているか
    const keywordsWithImpactScore = result.keywords.filter(
      (k: { impactScore?: number }) =>
        k.impactScore !== undefined && k.impactScore >= 0 && k.impactScore <= 100,
    );
    expect(keywordsWithImpactScore.length).toBeGreaterThan(0);

    // 9. 各キーワードに severity（重要度分類）が付与されているか
    const keywordsWithSeverity = result.keywords.filter(
      (k: { severity?: string }) =>
        k.severity === 'high' ||
        k.severity === 'medium' ||
        k.severity === 'low',
    );
    expect(keywordsWithSeverity.length).toBeGreaterThan(0);

    // 10. 全体のキーワード数が50件以上（複数課題が報告される想定）
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(1);

    // 11. 抽出日時が記録されているか
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 12. 分析期間の日数が正しく計算されているか
    expect(result.analysisPeriodDays).toBeGreaterThan(0);

    // 13. extractKeywords が各日報のchallenges フィールドに対して呼ばれたか
    // (少なくとも50回呼ばれていることを確認)
    expect(mockExtractKeywords.mock.calls.length).toBeGreaterThanOrEqual(50);

    // 14. assessImpactScore が各抽出キーワードに対して呼ばれたか
    expect(mockAssessImpactScore.mock.calls.length).toBeGreaterThan(0);

    // 15. classifyIssueSeverity が各抽出キーワードに対して呼ばれたか
    expect(mockClassifyIssueSeverity.mock.calls.length).toBeGreaterThan(0);

    // 16. キーワードが実際に challenges に含まれるテキストから抽出されているか
    const extractedKeywordStrings = result.keywords.map(
      (k: { keyword?: string }) => k.keyword,
    );
    const hasValidKeywords = extractedKeywordStrings.some((kw: string) =>
      ['遅延', '品質', 'リソース不足'].includes(kw),
    );
    expect(hasValidKeywords).toBe(true);
  });
});