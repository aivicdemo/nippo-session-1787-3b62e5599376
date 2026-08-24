import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ダッシュボード機能 - データ鮮度確保', () => {
  // SCEN-1049
  test('課題一覧がnullのとき、更新処理がエラーを返す', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-alpha',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    expect(() => {
      ensureDashboardDataFreshness(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/課題一覧|null|取得に失敗/);
  });
});