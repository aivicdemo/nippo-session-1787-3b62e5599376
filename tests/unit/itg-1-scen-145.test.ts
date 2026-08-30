import { validateReportSubmission } from '../../src/logic/input-validation-and-formatting';

describe('朝会報告管理システム - 日報送信検証', () => {
  // SCEN-145: 必須項目充足検証 - 各必須項目が空またはnullの場合にエラーを返す
  test('必須項目が不足している場合、該当項目ごとにRequiredFieldMissingErrorを返す', () => {
    const validReporterId = 'ENG001';
    const validTeamId = 'TEAM001';
    const validReportDate = '2024-01-15';
    const validYesterdayAccomplishment = 'バグ修正を実施しました';
    const validIssueDescription = 'デプロイ環境の不安定性';

    // テストケース1: reporterIdがnull
    const testCase1Result = validateReportSubmission({
      reporterId: null as any,
      teamId: validTeamId,
      reportDate: validReportDate,
      yesterdayAccomplishment: validYesterdayAccomplishment,
      issueDescription: validIssueDescription,
    });
    expect(testCase1Result.status).toBe('FAILED');
    expect(testCase1Result.errors).toContainEqual(
      expect.objectContaining({
        fieldName: 'reporterId',
        message: expect.stringMatching(/報告者ID/),
      })
    );

    // テストケース2: teamIdが空文字列
    const testCase2Result = validateReportSubmission({
      reporterId: validReporterId,
      teamId: '',
      reportDate: validReportDate,
      yesterdayAccomplishment: validYesterdayAccomplishment,
      issueDescription: validIssueDescription,
    });
    expect(testCase2Result.status).toBe('FAILED');
    expect(testCase2Result.errors).toContainEqual(
      expect.objectContaining({
        fieldName: 'teamId',
        message: expect.stringMatching(/チームID/),
      })
    );

    // テストケース3: reportDateが空文字列
    const testCase3Result = validateReportSubmission({
      reporterId: validReporterId,
      teamId: validTeamId,
      reportDate: '',
      yesterdayAccomplishment: validYesterdayAccomplishment,
      issueDescription: validIssueDescription,
    });
    expect(testCase3Result.status).toBe('FAILED');
    expect(testCase3Result.errors).toContainEqual(
      expect.objectContaining({
        fieldName: 'reportDate',
        message: expect.stringMatching(/報告日/),
      })
    );

    // テストケース4: yesterdayAccomplishmentがnull
    const testCase4Result = validateReportSubmission({
      reporterId: validReporterId,
      teamId: validTeamId,
      reportDate: validReportDate,
      yesterdayAccomplishment: null as any,
      issueDescription: validIssueDescription,
    });
    expect(testCase4Result.status).toBe('FAILED');
    expect(testCase4Result.errors).toContainEqual(
      expect.objectContaining({
        fieldName: 'yesterdayAccomplishment',
        message: expect.stringMatching(/実績/),
      })
    );

    // テストケース5: issueDescriptionが空文字列
    const testCase5Result = validateReportSubmission({
      reporterId: validReporterId,
      teamId: validTeamId,
      reportDate: validReportDate,
      yesterdayAccomplishment: validYesterdayAccomplishment,
      issueDescription: '',
    });
    expect(testCase5Result.status).toBe('FAILED');
    expect(testCase5Result.errors).toContainEqual(
      expect.objectContaining({
        fieldName: 'issueDescription',
        message: expect.stringMatching(/課題/),
      })
    );
  });
});