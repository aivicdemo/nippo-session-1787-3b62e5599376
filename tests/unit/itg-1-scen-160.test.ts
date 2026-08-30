import { getReportSubmissionTimestamp } from '../../src/logic/report-persistence';
import type { GetReportSubmissionTimestampInput } from '../../src/logic/report-persistence';

describe('朝会報告管理システム - 日報送信時刻取得', () => {
  test('SCEN-160: 指定された日報が存在しない場合、適切なエラーが発生すること', () => {
    // Arrange
    const reportIdNotFound = 'report-999';
    const requestingUserIdValid = 'user-001';

    const input: GetReportSubmissionTimestampInput = {
      reportId: reportIdNotFound,
      requestingUserId: requestingUserIdValid,
    };

    // Act & Assert
    expect(() => getReportSubmissionTimestamp(input)).toThrow(
      /指定された日報が見つかりません。報告ID: report-999/
    );
  });
});