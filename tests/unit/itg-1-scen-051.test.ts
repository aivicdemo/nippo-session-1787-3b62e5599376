import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import type { Report, RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出・ランク付け', () => {
  // SCEN-051: 複数の日報から課題キーワードを自動抽出し、発生頻度と影響度に基づいて優先度スコアを計算して、優先度別に順序付けされた課題一覧を生成する
  test('extractAndRankIssuesFromReports - 正常系：複数日報から課題を抽出・ランク付けして優先度順に返却', () => {
    // Arrange
    const baseDate = new Date('2024-01-15T09:00:00Z');
    const analysisStartDate = new Date('2023-12-16T00:00:00Z');
    const analysisEndDate = new Date('2024-01-15T23:59:59Z');

    const reports: Report[] = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-15T08:00:00Z'),
        issueText: 'バグが多く発生している。テスト環境が不安定な状況が続いている。',
        teamId: 'team-001',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-15T08:15:00Z'),
        issueText: 'ビルド失敗が頻発している。バグ修正に時間がかかっている。',
        teamId: 'team-001',
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-15T08:30:00Z'),
        issueText: 'リソース不足でテスト環境の確保が困難である。進捗が遅延している。',
        teamId: 'team-002',
      },
    ];

    // Mock現在時刻の取得
    jest.useFakeTimers();
    jest.setSystemTime(baseDate);

    // Act
    const result: RankedIssueList = extractAndRankIssuesFromReports({
      reports: reports,
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
    });

    // Assert
    // 1. issues 配列に複数の RankedIssue オブジェクトが含まれていることを確認
    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);

    // 2. issues 配列が優先度スコア（priorityScore）の高い順に整列されていることを確認
    for (let i = 0; i < result.issues.length - 1; i++) {
      expect(result.issues[i].priorityScore).toBeGreaterThanOrEqual(
        result.issues[i + 1].priorityScore
      );
    }

    // 3. 各 RankedIssue オブジェクトの必須フィールドが存在することを確認
    result.issues.forEach((issue) => {
      expect(issue.issueId).toBeDefined();
      expect(typeof issue.issueId).toBe('string');
      expect(issue.keyword).toBeDefined();
      expect(typeof issue.keyword).toBe('string');
      expect(issue.frequency).toBeDefined();
      expect(typeof issue.frequency).toBe('number');
      expect(issue.frequency).toBeGreaterThan(0);
      expect(issue.impactScore).toBeDefined();
      expect(typeof issue.impactScore).toBe('number');
      expect(issue.impactScore).toBeGreaterThanOrEqual(0);
      expect(issue.impactScore).toBeLessThanOrEqual(100);
      expect(issue.priorityScore).toBeDefined();
      expect(typeof issue.priorityScore).toBe('number');
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(issue.priorityRank).toBeDefined();
      expect(['高', '中', '低']).toContain(issue.priorityRank);
      expect(issue.colorCode).toBeDefined();
      expect(['red', 'yellow', 'green']).toContain(issue.colorCode);
      expect(issue.confidenceScore).toBeDefined();
      expect(typeof issue.confidenceScore).toBe('number');
      expect(issue.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(issue.confidenceScore).toBeLessThanOrEqual(100);
      expect(issue.affectedTeamCount).toBeDefined();
      expect(typeof issue.affectedTeamCount).toBe('number');
      expect(issue.affectedTeamCount).toBeGreaterThan(0);
    });

    // 4. totalIssueCount が抽出されたキーワード数と一致することを確認
    expect(result.totalIssueCount).toBe(result.issues.length);
    expect(result.totalIssueCount).toBeGreaterThan(0);

    // 5. analysisTimestamp が Date オブジェクトであることを確認
    expect(result.analysisTimestamp).toBeInstanceOf(Date);
    // 実行時刻の月日が同じであることを確認（秒単位での完全一致は避ける）
    expect(result.analysisTimestamp.getFullYear()).toBe(baseDate.getFullYear());
    expect(result.analysisTimestamp.getMonth()).toBe(baseDate.getMonth());
    expect(result.analysisTimestamp.getDate()).toBe(baseDate.getDate());

    // 6. lowConfidenceIssueCount が 0 以上であることを確認（信頼度が基準値以上のため）
    expect(result.lowConfidenceIssueCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.lowConfidenceIssueCount).toBe('number');

    // 7. 優先度ランクと色コードの対応が正しいことを確認
    result.issues.forEach((issue) => {
      if (issue.priorityRank === '高') {
        expect(issue.colorCode).toBe('red');
      } else if (issue.priorityRank === '中') {
        expect(issue.colorCode).toBe('yellow');
      } else if (issue.priorityRank === '低') {
        expect(issue.colorCode).toBe('green');
      }
    });

    // 8. 各課題が少なくとも1つ以上のチームから報告されていることを確認
    result.issues.forEach((issue) => {
      expect(issue.affectedTeamCount).toBeGreaterThanOrEqual(1);
    });

    jest.useRealTimers();
  });
});