import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 権限検証エラーケース', () => {
  test('SCEN-2367: 集約を指示した開発部長の権限が確認できないとき処理がエラーになる', async () => {
    const requestedByUserId = 'dept_manager_001';
    const targetYear = 2024;
    const targetMonth = 12;
    const teamIdFilter = undefined;

    const mockAuthorizationService = {
      verifyAggregationAuthority: jest.fn().mockImplementation(() => {
        const error = new Error('AGGREGATION_AUTHORITY_NOT_FOUND');
        error.name = 'AuthorizationException';
        throw error;
      }),
    };

    const mockLogger = {
      error: jest.fn(),
    };

    const mockAggregationRepository = {
      create: jest.fn(),
    };

    let thrownError: Error | null = null;

    try {
      await extractMonthlyReportData(
        {
          targetYear,
          targetMonth,
          requestedByUserId,
          teamIdFilter,
        },
        {
          authorizationService: mockAuthorizationService,
          logger: mockLogger,
          aggregationRepository: mockAggregationRepository,
        }
      );
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/権限/);

    expect(mockAuthorizationService.verifyAggregationAuthority).toHaveBeenCalledWith(
      requestedByUserId
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('dept_manager_001')
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('集約指示')
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('権限確認失敗')
    );

    expect(mockAggregationRepository.create).not.toHaveBeenCalled();
  });
});