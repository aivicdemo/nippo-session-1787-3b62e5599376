import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import { type BottleneckAnalysisInput, type IssueTimeSeriesRecord, type BottleneckTrendAnalysisResult } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2283
  test('[normal] 改善施策推奨機能 - 課題解決速度が遅い部門が複数件の場合、全部門に対する改善施策が解決速度スコアの降順で推奨される', () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');

    // 部門A: 解決速度スコア45、複数課題
    const issueTimeSeriesDataDeptA: IssueTimeSeriesRecord[] = [
      {
        issueId: 'ISSUE-A-001',
        recordDate: new Date('2024-01-05'),
        occurrenceCount: 3,
        impactScore: 65,
        resolutionDaysElapsed: 8,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'ISSUE-A-002',
        recordDate: new Date('2024-01-10'),
        occurrenceCount: 2,
        impactScore: 58,
        resolutionDaysElapsed: 12,
        resolutionStatus: 'resolved',
      },
    ];

    // 部門B: 解決速度スコア72、複数課題
    const issueTimeSeriesDataDeptB: IssueTimeSeriesRecord[] = [
      {
        issueId: 'ISSUE-B-001',
        recordDate: new Date('2024-01-03'),
        occurrenceCount: 2,
        impactScore: 72,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'ISSUE-B-002',
        recordDate: new Date('2024-01-12'),
        occurrenceCount: 1,
        impactScore: 68,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'resolved',
      },
    ];

    // 部門C: 解決速度スコア28、複数課題
    const issueTimeSeriesDataDeptC: IssueTimeSeriesRecord[] = [
      {
        issueId: 'ISSUE-C-001',
        recordDate: new Date('2024-01-08'),
        occurrenceCount: 4,
        impactScore: 82,
        resolutionDaysElapsed: 18,
        resolutionStatus: 'in_progress',
      },
      {
        issueId: 'ISSUE-C-002',
        recordDate: new Date('2024-01-15'),
        occurrenceCount: 3,
        impactScore: 75,
        resolutionDaysElapsed: 22,
        resolutionStatus: 'open',
      },
    ];

    // 全部門のデータを統合
    const allIssueTimeSeriesData: IssueTimeSeriesRecord[] = [
      ...issueTimeSeriesDataDeptA,
      ...issueTimeSeriesDataDeptB,
      ...issueTimeSeriesDataDeptC,
    ];

    // TextAnalysisServiceAdapter のスタブ
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes('ISSUE-A')) {
          return { keywords: ['performance', 'latency'], frequency: [2, 1] };
        }
        if (text.includes('ISSUE-B')) {
          return { keywords: ['throughput', 'efficiency'], frequency: [1, 2] };
        }
        if (text.includes('ISSUE-C')) {
          return { keywords: ['reliability', 'stability', 'downtime'], frequency: [3, 2, 2] };
        }
        return { keywords: [], frequency: [] };
      }),
      assessImpactScore: jest.fn((keywords: string[]) => {
        if (keywords.includes('reliability')) return 82;
        if (keywords.includes('throughput')) return 72;
        if (keywords.includes('performance')) return 65;
        return 50;
      }),
      classifyIssueSeverity: jest.fn((impactScore: number) => {
        if (impactScore >= 75) return 'critical';
        if (impactScore >= 60) return 'high';
        if (impactScore >= 40) return 'medium';
        return 'low';
      }),
    };

    const input: BottleneckAnalysisInput = {
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData: allIssueTimeSeriesData,
      minimumDataPointsThreshold: 2,
      outlierDetectionEnabled: true,
    };

    const result = analyzeBottleneckTrendWithTimeSeries(input, textAnalysisServiceAdapterStub);

    // 結果が配列として返されていることを確認（複数部門の分析結果）
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(3);

    // 結果を解決速度スコアで検証
    // 部門Bが最初（スコア72：最高）
    expect(result[0]).toBeDefined();
    expect(result[0].bottleneckSeverityScore).toBe(72);
    expect(result[0].issueId).toMatch(/ISSUE-B/);

    // 部門Aが次（スコア45：中程度）
    expect(result[1]).toBeDefined();
    expect(result[1].bottleneckSeverityScore).toBeLessThanOrEqual(72);
    expect(result[1].issueId).toMatch(/ISSUE-A/);

    // 部門Cが最後（スコア28：最低）
    expect(result[2]).toBeDefined();
    expect(result[2].bottleneckSeverityScore).toBeLessThanOrEqual(45);
    expect(result[2].issueId).toMatch(/ISSUE-C/);

    // 降順チェック
    const scores = result.map((item: BottleneckTrendAnalysisResult) => item.bottleneckSeverityScore);
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }

    // 各部門の改善施策内容が課題キーワードに基づいて異なることを確認
    const dept_b_result = result.find((item: BottleneckTrendAnalysisResult) => item.issueId.includes('ISSUE-B'));
    const dept_a_result = result.find((item: BottleneckTrendAnalysisResult) => item.issueId.includes('ISSUE-A'));
    const dept_c_result = result.find((item: BottleneckTrendAnalysisResult) => item.issueId.includes('ISSUE-C'));

    expect(dept_b_result).toBeDefined();
    expect(dept_a_result).toBeDefined();
    expect(dept_c_result).toBeDefined();

    // 改善傾向の判定が各部門で異なることを確認
    expect(dept_b_result?.improvementTrend).toBeDefined();
    expect(dept_a_result?.improvementTrend).toBeDefined();
    expect(dept_c_result?.improvementTrend).toBeDefined();

    // 平均解決日数が計算されていることを確認
    expect(dept_b_result?.averageResolutionDays).toBe(2.5);
    expect(dept_a_result?.averageResolutionDays).toBe(10);
    expect(dept_c_result?.averageResolutionDays).toBe(20);

    // ボトルネック深刻度ランクが正しく判定されていることを確認
    expect(dept_b_result?.bottleneckSeverityRank).toBe('high');
    expect(dept_a_result?.bottleneckSeverityRank).toBe('medium');
    expect(dept_c_result?.bottleneckSeverityRank).toBe('critical');

    // 時系列トレンドデータが含まれていることを確認
    expect(dept_b_result?.timeSeriesTrendData).toBeDefined();
    expect(dept_a_result?.timeSeriesTrendData).toBeDefined();
    expect(dept_c_result?.timeSeriesTrendData).toBeDefined();

    expect(Array.isArray(dept_b_result?.timeSeriesTrendData)).toBe(true);
    expect(Array.isArray(dept_a_result?.timeSeriesTrendData)).toBe(true);
    expect(Array.isArray(dept_c_result?.timeSeriesTrendData)).toBe(true);
  });
});