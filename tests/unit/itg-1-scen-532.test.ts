import { analyzeIssueRecurrencePatterns } from '../../src/logic/report-search-and-retrieval';

describe('朝会報告管理システム - 課題再発パターン分析', () => {
  test('SCEN-532: 課題項目が空の日報はスキップされ、有効な課題データのみで再発パターンを分析する', () => {
    // テスト用の日報データセットを準備
    const mockReportData = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-15T09:00:00Z'),
        memberId: 'M001',
        memberName: 'Employee A',
        teamId: 'team-001',
        teamName: 'Development Team',
        issues: '', // 空文字列 - スキップ対象
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-15T09:30:00Z'),
        memberId: 'M002',
        memberName: 'Employee B',
        teamId: 'team-001',
        teamName: 'Development Team',
        issues: 'データベース接続エラー', // 有効な課題
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-16T09:00:00Z'),
        memberId: 'M003',
        memberName: 'Employee C',
        teamId: 'team-001',
        teamName: 'Development Team',
        issues: '', // 空文字列 - スキップ対象
      },
    ];

    // Mock関数を定義
    const mockRetrieveIssueDataByCondition = jest.fn(() => mockReportData);
    const mockJudgeAccessPermission = jest.fn(() => true);
    const mockDeduplicateAndMergeIssues = jest.fn((issues) => {
      // 空でない課題のみを処理
      const validIssues = issues.filter((issue: { issueContent: string }) => issue.issueContent && issue.issueContent.trim() !== '');
      return validIssues.length > 0
        ? [
            {
              canonicalIssueId: 'issue-001',
              mergedIssueIds: ['M002'],
              mergedFrequency: 1,
              normalizedKeyword: 'データベース接続エラー',
              firstOccurrenceDate: new Date('2024-01-15'),
              lastOccurrenceDate: new Date('2024-01-15'),
            },
          ]
        : [];
    });

    // global.fetchをモック（必要に応じて）
    global.fetch = jest.fn();

    // 関数を呼び出し
    const result = analyzeIssueRecurrencePatterns(
      new Date('2024-01-15'),
      new Date('2024-01-16'),
      undefined, // teamId未指定
      undefined, // issueKeywords未指定
      2, // minRecurrenceThreshold
      'manager001', // requestingUserId
      mockRetrieveIssueDataByCondition,
      mockJudgeAccessPermission,
      mockDeduplicateAndMergeIssues,
    );

    // 期待結果の検証

    // (1) analysisIdが文字列で存在する
    expect(typeof result.analysisId).toBe('string');
    expect(result.analysisId.length).toBeGreaterThan(0);

    // (2) analysisPeriodが指定範囲と一致する
    expect(result.analysisPeriod.startDate).toEqual(new Date('2024-01-15'));
    expect(result.analysisPeriod.endDate).toEqual(new Date('2024-01-16'));

    // (3) recurrencePatternsが有効な課題のみを含む（issues=''の日報2件はスキップ）
    expect(Array.isArray(result.recurrencePatterns)).toBe(true);
    // 有効な課題はM002の1件のみ
    expect(result.recurrencePatterns.length).toBeLessThanOrEqual(1);
    if (result.recurrencePatterns.length > 0) {
      expect(result.recurrencePatterns[0]).toHaveProperty('issueKeyword');
      expect(result.recurrencePatterns[0]).toHaveProperty('occurrenceCount');
      expect(result.recurrencePatterns[0]).toHaveProperty('affectedMembers');
    }

    // (4) bottleneckProgressionとvisualizationDataもissues=''の日報を除いた課題データで構成
    expect(Array.isArray(result.bottleneckProgression)).toBe(true);
    expect(result.visualizationData).toBeDefined();
    expect(typeof result.visualizationData).toBe('object');

    // (5) generatedAtがDate型で存在する
    expect(result.generatedAt instanceof Date).toBe(true);

    // 業務ルール制約の検証: issues=''の日報がスキップされていることを確認
    // mockDeduplicateAndMergeIssuesが呼ばれた際の入力を検証
    expect(mockDeduplicateAndMergeIssues).toHaveBeenCalled();
    const callArgs = mockDeduplicateAndMergeIssues.mock.calls[0][0];
    // 空文字列の課題は含まれていないはず
    const emptyIssueCount = callArgs.filter(
      (arg: { issueContent: string }) => !arg.issueContent || arg.issueContent.trim() === '',
    ).length;
    expect(emptyIssueCount).toBe(0);
  });
});