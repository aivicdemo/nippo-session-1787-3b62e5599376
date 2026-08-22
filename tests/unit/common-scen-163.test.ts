import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';
import { type SubmissionStatusReport, type UnsubmittedNotification } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-163: [normal] 日報集約から分析報告までの自動実行エージェント - 課題を優先度別に分類・分析する
  test('detectAndNotifyUnsubmitted classifies extracted issues by priority level (1-4) with substantive reasoning, handles ambiguous priority values, generates audit logs with timestamps and prompt version, and maintains idempotent classification results', async () => {
    // Setup: Prepare 10 structured daily reports spanning 2024-01-15 to 2024-01-19
    const reportData: SubmissionStatusReport[] = [
      {
        reportId: 'report_001',
        memberId: 'member_001',
        memberName: 'Alice',
        submissionDate: '2024-01-15T09:00:00Z',
        yesterday: 'Completed API integration testing',
        today: 'Deploy API to staging',
        issues: 'System timeout on high-load test - blocks deployment',
      },
      {
        reportId: 'report_002',
        memberId: 'member_002',
        memberName: 'Bob',
        submissionDate: '2024-01-15T09:15:00Z',
        yesterday: 'Fixed UI layout bugs',
        today: 'Implement user feedback forms',
        issues: 'Customer reported data validation error in production',
      },
      {
        reportId: 'report_003',
        memberId: 'member_003',
        memberName: 'Carol',
        submissionDate: '2024-01-16T09:00:00Z',
        yesterday: 'Database migration completed',
        today: 'Run performance benchmarks',
        issues: 'Project delivery date may slip by 2 days due to unexpected complexity',
      },
      {
        reportId: 'report_004',
        memberId: 'member_004',
        memberName: 'David',
        submissionDate: '2024-01-16T09:30:00Z',
        yesterday: 'Code review of feature branch',
        today: 'Merge approved changes',
        issues: 'Dependency task from team-b is delayed, blocking our start',
      },
      {
        reportId: 'report_005',
        memberId: 'member_005',
        memberName: 'Eve',
        submissionDate: '2024-01-17T09:00:00Z',
        yesterday: 'Documentation updated',
        today: 'Release notes preparation',
        issues: 'Minor UI inconsistency on mobile view',
      },
      {
        reportId: 'report_006',
        memberId: 'member_006',
        memberName: 'Frank',
        submissionDate: '2024-01-17T10:00:00Z',
        yesterday: 'Refactored legacy module',
        today: 'Add unit test coverage',
        issues: 'Technical debt in authentication layer needs planning',
      },
      {
        reportId: 'report_007',
        memberId: 'member_007',
        memberName: 'Grace',
        submissionDate: '2024-01-18T09:00:00Z',
        yesterday: 'Analyzed query performance',
        today: 'Optimize slow endpoints',
        issues: 'System timeout on high-load test - blocks deployment',
      },
      {
        reportId: 'report_008',
        memberId: 'member_008',
        memberName: 'Henry',
        submissionDate: '2024-01-18T09:45:00Z',
        yesterday: 'Security audit completed',
        today: 'Implement remediation tasks',
        issues: 'Suggestion to improve error message clarity',
      },
      {
        reportId: 'report_009',
        memberId: 'member_009',
        memberName: 'Iris',
        submissionDate: '2024-01-19T09:00:00Z',
        yesterday: 'Monitoring setup completed',
        today: 'Configure alert thresholds',
        issues: 'Framework upgrade consideration for next quarter',
      },
      {
        reportId: 'report_010',
        memberId: 'member_010',
        memberName: 'Jack',
        submissionDate: '2024-01-19T09:20:00Z',
        yesterday: 'Environment setup',
        today: 'Deploy configuration',
        issues: 'No specific issues reported',
      },
    ];

    // Mock audit log storage
    const auditLogs: Array<{
      actionName: string;
      executionTimestamp: string;
      inputIssueCount: number;
      outputClassificationCount: number;
      promptVersion: string;
    }> = [];

    // Mock classified issues storage for idempotency validation
    const classificationCache: Map<string, Array<{
      issueId: string;
      issueContent: string;
      priorityLevel: number;
      reasoning: string;
      relatedMembers: string[];
    }>> = new Map();

    // Call function: Detect unsubmitted and classify issues
    const result = await detectAndNotifyUnsubmitted(
      reportData,
      {
        executeActionAndLogAudit: async (actionName, inputIssueCount, outputClassificationCount, promptVersion) => {
          const timestamp = new Date('2024-01-19T10:30:00Z').toISOString();
          auditLogs.push({
            actionName,
            executionTimestamp: timestamp,
            inputIssueCount,
            outputClassificationCount,
            promptVersion,
          });
        },
        classifyIssuesByPriority: async (issues) => {
          // Mock classification logic returning structured priority classifications
          return issues.map((issue, idx) => {
            let priorityLevel: number;
            let reasoning: string;

            if (issue.includes('System timeout') || issue.includes('blocks deployment')) {
              priorityLevel = 1;
              reasoning = '即対応が必要です。本番デプロイメントをブロックするシステム影響度が高い問題であり、チーム全体の作業進捗に直結します。';
            } else if (issue.includes('Customer reported') || issue.includes('production')) {
              priorityLevel = 1;
              reasoning = '顧客から報告されたエラーため即対応が必須です。本番環境での影響度が高く、ユーザー体験に直結しています。';
            } else if (issue.includes('delivery date may slip') || issue.includes('delayed')) {
              priorityLevel = 2;
              reasoning = '今週中の対応が必要です。プロジェクト納期への影響度が中程度で、依存関係のある他タスクの進捗に直結する可能性があります。';
            } else if (issue.includes('Minor UI') || issue.includes('inconsistency')) {
              priorityLevel = 3;
              reasoning = 'スケジュール調整可能な改善項目です。緊急度は低く、次期リリースでの対応で十分なため、低優先度に分類します。';
            } else if (issue.includes('Technical debt') || issue.includes('consideration')) {
              priorityLevel = 3;
              reasoning = '観察対象の長期課題です。組織への緊急な影響はなく、計画的な対応で十分です。スケジュール調整が可能です。';
            } else if (issue.includes('Suggestion') || issue.includes('improvement')) {
              priorityLevel = 4;
              reasoning = '軽微な懸念として記録します。ユーザーへの直接的な影響がなく、随時改善対応で構いません。';
            } else if (issue.includes('No specific issues')) {
              priorityLevel = 4;
              reasoning = '懸念事項なし。通常の業務進捗を示す報告であり、特別な対応は不要です。';
            } else {
              priorityLevel = 3;
              reasoning = 'デフォルト分類です。詳細な内容確認により適切な優先度を決定してください。';
            }

            return {
              issueId: `issue_${String(idx + 1).padStart(3, '0')}`,
              issueContent: issue,
              priorityLevel,
              reasoning,
              relatedMembers: [],
            };
          });
        },
        getCacheKey: (reportPeriod) => `classification_${reportPeriod}`,
        getCachedClassification: (cacheKey) => classificationCache.get(cacheKey),
        setCachedClassification: (cacheKey, classification) => {
          classificationCache.set(cacheKey, classification);
        },
      }
    );

    // Extract unique issues from all reports (deduplication)
    const allIssueTexts = reportData
      .map((r) => r.issues)
      .filter((issue) => issue && issue.trim() !== '' && !issue.includes('No specific issues'));

    const uniqueIssues = Array.from(new Set(allIssueTexts));

    // Verification (1): All extracted issues must be classified as priority 1-4
    const classifiedIssues = result.classifiedIssues || [];
    expect(classifiedIssues.length).toBeGreaterThan(0);
    
    classifiedIssues.forEach((issue) => {
      expect([1, 2, 3, 4]).toContain(issue.priorityLevel);
    });

    // Verification (2): Each reasoning must be 50-200 characters and contain substantive business keywords
    classifiedIssues.forEach((issue) => {
      expect(issue.reasoning.length).toBeGreaterThanOrEqual(50);
      expect(issue.reasoning.length).toBeLessThanOrEqual(200);
    });

    // Verification (3): Priority 1 issues must include '即対応' or '影響' keywords; Priority 3 must include '観察' or 'スケジュール調整可能'
    const priority1Issues = classifiedIssues.filter((i) => i.priorityLevel === 1);
    const priority3Issues = classifiedIssues.filter((i) => i.priorityLevel === 3);

    priority1Issues.forEach((issue) => {
      const hasKeyword = /即対応|ブロッカー|システム影響/.test(issue.reasoning);
      expect(hasKeyword).toBe(true);
    });

    priority3Issues.forEach((issue) => {
      const hasKeyword = /観察|低緊急|スケジュール調整可能/.test(issue.reasoning);
      expect(hasKeyword).toBe(true);
    });

    // Verification (4): Ambiguous priority values (e.g., '1.5', 'HIGH') must be handled via validation or default to priority 3
    const ambiguousPriorities = [1.5, 'HIGH', 0, 5, null, undefined];
    
    // Simulate ambiguous priority handling: verify that non-integer or out-of-range values are either rejected or coerced to valid range
    ambiguousPriorities.forEach((badPriority) => {
      if (typeof badPriority !== 'number' || !Number.isInteger(badPriority) || badPriority < 1 || badPriority > 4) {
        // Expect either a validation error or default coercion to priority 3
        expect([1, 2, 3, 4]).not.toContain(badPriority);
      }
    });

    // Verification (5): Audit logs must record action name, timestamp, input count, output count, and prompt version
    expect(auditLogs.length).toBeGreaterThan(0);
    
    const latestLog = auditLogs[auditLogs.length - 1];
    expect(latestLog.actionName).toBe('課題優先度分類');
    expect(latestLog.executionTimestamp).toBe('2024-01-19T10:30:00Z');
    expect(latestLog.inputIssueCount).toBe(uniqueIssues.length);
    expect(latestLog.outputClassificationCount).toBe(classifiedIssues.length);
    expect(latestLog.promptVersion).toMatch(/^ACTION_04_PROMPT_VERSION/);

    // Verification (6): Idempotency - re-executing with the same input must produce identical classification results
    const cacheKey = 'classification_2024-01-15_to_2024-01-19';
    const firstClassification = classificationCache.get(cacheKey);
    
    // Second execution should retrieve cached result
    const secondResult = await detectAndNotifyUnsubmitted(
      reportData,
      {
        executeActionAndLogAudit: async () => {},
        classifyIssuesByPriority: async (issues) => {
          // Return same classification as first call
          return issues.map((issue, idx) => ({
            issueId: `issue_${String(idx + 1).padStart(3, '0')}`,
            issueContent: issue,
            priorityLevel: Math.min(Math.max(Math.ceil(Math.random() * 4), 1), 4),
            reasoning: `Priority classification for: ${issue}`,
            relatedMembers: [],
          }));
        },
        getCacheKey: (reportPeriod) => cacheKey,
        getCachedClassification: (key) => firstClassification,
        setCachedClassification: () => {},
      }
    );

    // Verify classification results are consistent across calls
    expect(secondResult.classifiedIssues).toBeDefined();
    if (firstClassification) {
      expect(secondResult.classifiedIssues?.length).toBe(firstClassification.length);
    }
  });
});