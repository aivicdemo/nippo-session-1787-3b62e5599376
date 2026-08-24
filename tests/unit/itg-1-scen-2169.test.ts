import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // SCEN-2169
  test('複数チーム・複数プロジェクトの日報で課題キーワード表記が統一されていない場合、エラーを返す', () => {
    const testInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'DB接続エラーが発生する',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-a',
    };

    const mockInconsistentContextData = {
      reportIds: ['report-001', 'report-002', 'report-003', 'report-004', 'report-005'],
      teamNames: ['TeamA', 'TeamB', 'TeamC'],
      projectNames: ['ProjectX', 'ProjectY'],
      keywordVariations: [
        { normalized: 'DB接続エラー', variations: ['DB接続エラー', 'データベース接続失敗', '接続エラー(DB)'] },
        { normalized: 'タイムアウト', variations: ['タイムアウト', 'TimeOut', 'timeout'] },
      ],
      inconsistentPairs: [
        { keyword1: 'DB接続エラー', keyword2: 'データベース接続失敗', teamId: 'team-b', reportId: 'report-002' },
        { keyword1: 'DB接続エラー', keyword2: '接続エラー(DB)', teamId: 'team-c', reportId: 'report-003' },
      ],
    };

    let resultError: any = null;
    let result: IssuePriorityScoringOutput | null = null;

    try {
      result = calculateIssuePriorityScore(testInput, mockInconsistentContextData);
    } catch (err) {
      resultError = err;
    }

    if (resultError) {
      expect(resultError).toBeDefined();
      expect(resultError.code || resultError.errorCode).toBe('KEYWORD_INCONSISTENCY_DETECTED');
      expect(resultError.message || resultError.toString()).toMatch(/複数チーム間で同一課題の表記が統一されていません/);
      expect(resultError.message || resultError.toString()).toMatch(/キーワード辞書/);
    } else if (result && 'error' in result) {
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('KEYWORD_INCONSISTENCY_DETECTED');
      expect(result.error.message).toMatch(/複数チーム間で同一課題の表記が統一されていません/);
      expect(result.error.message).toMatch(/キーワード辞書/);
    } else {
      fail('期待されるエラーが発生しませんでした。KEYWORD_INCONSISTENCY_DETECTEDエラーが返されるべきです。');
    }
  });
});