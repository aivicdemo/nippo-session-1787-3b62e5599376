import { analyzeIssueRecurrencePatterns } from '../../src/logic/report-search-and-retrieval';
import type { IssueRecurrenceAnalysisInput, IssueRecurrenceAnalysisResult, RecurrencePattern, BottleneckChangePoint } from '../../src/logic/report-search-and-retrieval';

describe('analyzeIssueRecurrencePatterns', () => {
  test('SCEN-531: [normal] 指定期間内の課題データから再発パターンを時系列で分析し、ボトルネック変化を可視化レポートとして出力する', () => {
    const startDateObj = new Date('2024-01-15T00:00:00Z');
    const endDateObj = new Date('2024-01-19T23:59:59Z');
    const requestingUserIdForTest = 'manager-001';
    
    const input: IssueRecurrenceAnalysisInput = {
      startDate: startDateObj,
      endDate: endDateObj,
      teamId: undefined,
      issueKeywords: ['バグ', 'パフォーマンス', '設計', 'テスト'],
      minRecurrenceThreshold: 2,
      requestingUserId: requestingUserIdForTest,
    };

    const mockIssueData = [
      {
        issueId: 'issue-001',
        keyword: 'バグ',
        content: 'ビルド時のバグが複数発生',
        sourceReportId: 'report-001',
        extractedKeyword: 'バグ',
        frequency: 3,
        date: '2024-01-15',
        memberId: 'engineer-001',
      },
      {
        issueId: 'issue-002',
        keyword: 'バグ',
        content: 'ビルドエラーが発生',
        sourceReportId: 'report-002',
        extractedKeyword: 'バグ',
        frequency: 2,
        date: '2024-01-16',
        memberId: 'engineer-002',
      },
      {
        issueId: 'issue-003',
        keyword: 'パフォーマンス',
        content: 'パフォーマンス低下が報告',
        sourceReportId: 'report-003',
        extractedKeyword: 'パフォーマンス',
        frequency: 2,
        date: '2024-01-17',
        memberId: 'engineer-001',
      },
      {
        issueId: 'issue-004',
        keyword: 'テスト',
        content: 'テスト失敗が多数',
        sourceReportId: 'report-004',
        extractedKeyword: 'テスト',
        frequency: 1,
        date: '2024-01-18',
        memberId: 'engineer-003',
      },
    ];

    const mockDedupedIssues = [
      {
        normalizedIssue: 'ビルド時のバグ',
        occurrenceCount: 5,
        affectedMembers: ['engineer-001', 'engineer-002'],
        firstReportedDate: '2024-01-15',
        lastReportedDate: '2024-01-16',
        severity: '高',
      },
      {
        normalizedIssue: 'パフォーマンス低下',
        occurrenceCount: 2,
        affectedMembers: ['engineer-001'],
        firstReportedDate: '2024-01-17',
        lastReportedDate: '2024-01-17',
        severity: '中',
      },
      {
        normalizedIssue: 'テスト失敗',
        occurrenceCount: 1,
        affectedMembers: ['engineer-003'],
        firstReportedDate: '2024-01-18',
        lastReportedDate: '2024-01-18',
        severity: '低',
      },
    ];

    global.retrieveIssueDataByCondition = jest.fn().mockReturnValue(mockIssueData);
    global.judgeAccessPermission = jest.fn().mockReturnValue(true);
    global.deduplicateAndMergeIssues = jest.fn().mockReturnValue(mockDedupedIssues);

    const result: IssueRecurrenceAnalysisResult = analyzeIssueRecurrencePatterns(input);

    expect(result).toBeDefined();
    expect(result.analysisId).toBeDefined();
    expect(typeof result.analysisId).toBe('string');

    expect(result.analysisPeriod).toEqual({
      startDate: startDateObj,
      endDate: endDateObj,
    });

    expect(result.recurrencePatterns).toBeDefined();
    expect(Array.isArray(result.recurrencePatterns)).toBe(true);
    expect(result.recurrencePatterns.length).toBe(3);

    const firstPattern: RecurrencePattern = result.recurrencePatterns[0];
    expect(firstPattern.normalizedIssue).toBe('ビルド時のバグ');
    expect(firstPattern.occurrenceCount).toBe(5);
    expect(firstPattern.affectedMembers).toEqual(['engineer-001', 'engineer-002']);
    expect(firstPattern.firstReportedDate).toBe('2024-01-15');
    expect(firstPattern.lastReportedDate).toBe('2024-01-16');
    expect(firstPattern.severity).toBe('高');

    const secondPattern: RecurrencePattern = result.recurrencePatterns[1];
    expect(secondPattern.normalizedIssue).toBe('パフォーマンス低下');
    expect(secondPattern.occurrenceCount).toBe(2);
    expect(secondPattern.severity).toBe('中');

    const thirdPattern: RecurrencePattern = result.recurrencePatterns[2];
    expect(thirdPattern.normalizedIssue).toBe('テスト失敗');
    expect(thirdPattern.occurrenceCount).toBe(1);
    expect(thirdPattern.severity).toBe('低');

    expect(result.bottleneckProgression).toBeDefined();
    expect(Array.isArray(result.bottleneckProgression)).toBe(true);
    expect(result.bottleneckProgression.length).toBeGreaterThan(0);

    const firstBottleneck: BottleneckChangePoint = result.bottleneckProgression[0];
    expect(firstBottleneck.changeDate).toBeDefined();
    expect(firstBottleneck.currentBottleneck).toBeDefined();
    expect(typeof firstBottleneck.currentBottleneck).toBe('string');

    expect(result.visualizationData).toBeDefined();
    expect(result.visualizationData.frequencyAxis).toBeDefined();
    expect(result.visualizationData.timeSeriesAxis).toBeDefined();
    expect(result.visualizationData.severityWeighting).toBeDefined();

    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt instanceof Date).toBe(true);

    expect(global.retrieveIssueDataByCondition).toHaveBeenCalledWith({
      startDate: startDateObj,
      endDate: endDateObj,
      teamId: undefined,
      issueKeywords: ['バグ', 'パフォーマンス', '設計', 'テスト'],
    });

    expect(global.judgeAccessPermission).toHaveBeenCalledWith(requestingUserIdForTest);

    expect(global.deduplicateAndMergeIssues).toHaveBeenCalled();
  });
});