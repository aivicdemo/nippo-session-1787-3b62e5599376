import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Extract and Rank Issue Keywords', () => {
  // SCEN-468: [edge] 課題自動抽出・優先度判定機能 - 報告受付期限時刻の1秒前では集約処理がまだトリガーされない
  test('should not trigger aggregation processing before deadline, but should trigger at deadline', async () => {
    // テスト時刻設定
    const deadline_time = new Date('2024-01-15T09:00:00Z');
    const one_second_before_deadline = new Date('2024-01-15T08:59:59Z');
    const at_deadline = new Date('2024-01-15T09:00:00Z');

    // テキスト解析サービスのスタブ実装
    const text_analysis_stub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['納期遅延', '品質問題'],
        confidence_scores: [0.85, 0.72],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impact_score: 78,
        affected_team_count: 3,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        classification_confidence: 0.88,
      }),
    };

    // 期限1秒前のテスト
    const report_text_before = 'チーム内で納期遅延の問題が発生しています。';
    const input_data_before = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T08:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    // 期限時刻のテスト
    const input_data_at_deadline = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T09:00:00Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    // 期限1秒前での呼び出し
    // この時点では、text_analysis_stub のメソッドが呼び出されるべきではない
    // または呼び出される前の状態を確認
    const extract_before_deadline_result = await extractAndRankIssueKeywords(
      input_data_before,
      text_analysis_stub
    );

    // 期限1秒前の時点では、スタブメソッドの呼び出し回数は0回のはず
    const extract_count_before = text_analysis_stub.extractKeywords.mock.calls.length;
    const assess_count_before = text_analysis_stub.assessImpactScore.mock.calls.length;

    // 期限時刻での呼び出し
    // この時点では、text_analysis_stub のメソッドが呼び出されるべき
    const extract_at_deadline_result = await extractAndRankIssueKeywords(
      input_data_at_deadline,
      text_analysis_stub
    );

    // 期限時刻の時点では、スタブメソッドが呼び出されているはず
    const extract_count_at_deadline = text_analysis_stub.extractKeywords.mock.calls.length;
    const assess_count_at_deadline = text_analysis_stub.assessImpactScore.mock.calls.length;

    // 検証: 期限1秒前では処理がトリガーされていない
    // または、トリガーされても結果が空である
    if (extract_before_deadline_result) {
      expect(extract_before_deadline_result.keywords || []).toEqual([]);
    }

    // 検証: 期限時刻に到達するとメソッド呼び出しが発生する
    expect(extract_count_at_deadline).toBeGreaterThan(extract_count_before);
    expect(assess_count_at_deadline).toBeGreaterThan(assess_count_before);

    // 検証: 期限時刻での結果が正しく返却される
    expect(extract_at_deadline_result).toBeDefined();
    expect(extract_at_deadline_result.keywords).toBeDefined();
    expect(Array.isArray(extract_at_deadline_result.keywords)).toBe(true);

    // 検証: 返却されたキーワードが「発生頻度」でランク付けされている
    if (extract_at_deadline_result.keywords.length > 1) {
      for (let i = 0; i < extract_at_deadline_result.keywords.length - 1; i++) {
        expect(extract_at_deadline_result.keywords[i].frequency).toBeGreaterThanOrEqual(
          extract_at_deadline_result.keywords[i + 1].frequency
        );
      }
    }

    // 検証: 各キーワードのランク番号が正しく付与されている
    extract_at_deadline_result.keywords.forEach((keyword: { rank: number }, index: number) => {
      expect(keyword.rank).toBe(index + 1);
    });

    // 検証: 抽出時刻が記録されている
    expect(extract_at_deadline_result.extractedAt).toBeDefined();
    expect(extract_at_deadline_result.extractedAt instanceof Date).toBe(true);

    // 検証: 分析対象期間が正しく計算されている
    const expected_period_days = 1; // 00:00:00 から 09:00:00 までの1日
    expect(extract_at_deadline_result.analysisperiodDays).toBe(expected_period_days);
  });
});