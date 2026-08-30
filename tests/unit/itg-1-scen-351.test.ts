import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import { type Report, type ExtractAndRankIssuesInput, type RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出と優先度付け', () => {
  test('SCEN-351: 課題辞書に未登録の課題表現を新規課題として登録し、デフォルト影響度で優先度スコアを計算する', () => {
    // 準備: 既知の課題のみを含む辞書
    const challengeThesaurus = [
      { canonical: 'ビルド失敗', synonyms: ['ビルドエラー', 'コンパイルエラー'] },
      { canonical: 'テスト失敗', synonyms: ['テスト不合格'] }
    ];

    // 準備: 複数の日報、うち1件に未知の課題表現を含める
    const reports: Report[] = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-15'),
        issueText: 'ビルド失敗が発生した',
        teamId: 'team-001'
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-15'),
        issueText: 'データベース接続タイムアウトが発生した',
        teamId: 'team-001'
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-15'),
        issueText: 'テスト失敗とビルド失敗の両方が起きた',
        teamId: 'team-001'
      }
    ];

    // 準備: 影響度重み（既知課題は定義、未知表現はデフォルト50）
    const impactWeights: Record<string, number> = {
      'ビルド失敗': 60,
      'テスト失敗': 70
    };

    // 準備: 入力オブジェクト
    const input: ExtractAndRankIssuesInput = {
      reports: reports,
      analysisStartDate: new Date('2024-01-01'),
      analysisEndDate: new Date('2024-01-31'),
      teamIds: ['team-001'],
      minimumConfidenceThreshold: 50
    };

    // 実行
    const result: RankedIssueList = extractAndRankIssuesFromReports(
      input.reports,
      input.analysisStartDate,
      input.analysisEndDate,
      input.teamIds,
      input.minimumConfidenceThreshold
    );

    // 検証: 戻り値の型と構造
    expect(result).toHaveProperty('issues');
    expect(result).toHaveProperty('totalIssueCount');
    expect(result).toHaveProperty('analysisTimestamp');
    expect(result).toHaveProperty('lowConfidenceIssueCount');
    expect(Array.isArray(result.issues)).toBe(true);

    // 検証: totalIssueCountが1以上
    expect(result.totalIssueCount).toBeGreaterThanOrEqual(1);

    // 検証: analysisTimestampが有効な日時
    expect(result.analysisTimestamp).toBeInstanceOf(Date);
    expect(result.analysisTimestamp.getTime()).toBeLessThanOrEqual(Date.now());
    expect(result.analysisTimestamp.getTime()).toBeGreaterThan(Date.now() - 10000);

    // 検証: issues配列の各要素が必須フィールドを持つ
    result.issues.forEach((issue) => {
      expect(issue).toHaveProperty('issueId');
      expect(issue).toHaveProperty('keyword');
      expect(issue).toHaveProperty('frequency');
      expect(issue).toHaveProperty('impactScore');
      expect(issue).toHaveProperty('priorityScore');
      expect(issue).toHaveProperty('priorityRank');
      expect(issue).toHaveProperty('colorCode');
      expect(issue).toHaveProperty('confidenceScore');
      expect(issue).toHaveProperty('affectedTeamCount');
    });

    // 検証: 未知表現『データベース接続タイムアウト』が課題として抽出されている
    const unknownIssue = result.issues.find((iss) =>
      iss.keyword.includes('データベース') || iss.keyword.includes('タイムアウト')
    );
    expect(unknownIssue).toBeDefined();

    // 検証: 未知表現に対する影響度スコアがデフォルト値50
    if (unknownIssue) {
      expect(unknownIssue.impactScore).toBe(50);

      // 検証: 優先度スコアが『発生頻度スコア × 0.4 + 50 × 0.6』に従って計算
      const expectedPriorityScore = unknownIssue.frequency * 0.4 + 50 * 0.6;
      expect(unknownIssue.priorityScore).toBeCloseTo(expectedPriorityScore, 1);

      // 検証: 優先度ランクが計算値に応じて正しく分類
      if (unknownIssue.priorityScore >= 70) {
        expect(unknownIssue.priorityRank).toBe('high');
      } else if (unknownIssue.priorityScore >= 40) {
        expect(unknownIssue.priorityRank).toBe('medium');
      } else {
        expect(unknownIssue.priorityRank).toBe('low');
      }

      // 検証: 色コードが優先度に対応している
      expect(['red', 'yellow', 'green']).toContain(unknownIssue.colorCode);
    }

    // 検証: 既知の課題も正しく抽出されている
    const knownIssues = result.issues.filter((iss) =>
      iss.keyword.includes('ビルド') || iss.keyword.includes('テスト')
    );
    expect(knownIssues.length).toBeGreaterThanOrEqual(1);

    // 検証: frequencyが正の整数
    result.issues.forEach((issue) => {
      expect(typeof issue.frequency).toBe('number');
      expect(issue.frequency).toBeGreaterThan(0);
      expect(Number.isInteger(issue.frequency)).toBe(true);
    });

    // 検証: スコアが0～100の範囲内
    result.issues.forEach((issue) => {
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(issue.impactScore).toBeGreaterThanOrEqual(0);
      expect(issue.impactScore).toBeLessThanOrEqual(100);
      expect(issue.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(issue.confidenceScore).toBeLessThanOrEqual(100);
    });

    // 検証: affectedTeamCountが1以上（少なくとも1つのチームで報告された）
    result.issues.forEach((issue) => {
      expect(issue.affectedTeamCount).toBeGreaterThanOrEqual(1);
    });

    // 検証: issues配列が優先度スコアで降順ソートされている
    for (let i = 0; i < result.issues.length - 1; i++) {
      expect(result.issues[i].priorityScore).toBeGreaterThanOrEqual(
        result.issues[i + 1].priorityScore
      );
    }

    // 検証: lowConfidenceIssueCountが0以上
    expect(typeof result.lowConfidenceIssueCount).toBe('number');
    expect(result.lowConfidenceIssueCount).toBeGreaterThanOrEqual(0);
  });
});