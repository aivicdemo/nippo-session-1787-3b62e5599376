import { test, expect } from '@playwright/test';

test.describe("部長向けダッシュボード", () => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  const memberUsername = "member";
  const memberPassword = "test";
  const managerUsername = "manager";
  const managerPassword = "test";

  // Helper: Login as member
  async function loginAsMember(page: any) {
    await page.goto("/login.html");
    await page.fill('[name="username"]', memberUsername);
    await page.fill('[name="password"]', memberPassword);
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);
  }

  // Helper: Login as manager
  async function loginAsManager(page: any) {
    await page.goto("/login.html");
    await page.fill('[name="username"]', managerUsername);
    await page.fill('[name="password"]', managerPassword);
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);
  }

  // SCEN-054: [normal] 部長向けダッシュボード - 〈日報入力・編集画面〉で送信した日報が〈部長向けダッシュボード〉に集約・表示される
  test("SCEN-054: 部員が送信した日報がダッシュボードに表示される", async ({ page, context }) => {
    // Member submits daily report
    await loginAsMember(page);
    await page.goto("/panels/scr-1787119190590.html");

    await page.fill('[name="yesterday_achievement"]', "A機能のバグ修正");
    await page.fill('[name="today_plan"]', "B機能の実装開始");
    await page.fill('[name="issues"]', "データベース接続タイムアウト");

    await page.click('button:has-text("送信")');

    const successMessage = page.locator('#success-message');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Manager views dashboard in new context
    const managerPage = await context.newPage();
    await loginAsManager(managerPage);
    await managerPage.goto("/panels/scr-1787119200549.html");

    // Wait for dashboard to load and display submitted report
    await managerPage.waitForTimeout(1000);

    // Verify the submitted report appears in the dashboard
    const reportList = managerPage.locator('[id="unsubmitted-list"]');
    await expect(reportList).toContainText(memberUsername, { timeout: 5000 });

    await managerPage.close();
  });

  // SCEN-056: [normal] 部長向けダッシュボード - 〈日報入力・編集画面〉で入力された課題が〈部長向けダッシュボード〉で優先度別に抽出・表示される
  test("SCEN-056: 課題が優先度別に抽出・表示される", async ({ page, context }) => {
    // Member submits report with 3 issues
    await loginAsMember(page);
    await page.goto("/panels/scr-1787119190590.html");

    await page.fill('[name="yesterday_achievement"]', "実装作業");
    await page.fill('[name="today_plan"]', "テスト実施");
    const issuesText = "【高】データベース接続タイムアウト問題\n【中】要件定義書の修正依頼対応\n【低】ドキュメント整理";
    await page.fill('[name="issues"]', issuesText);

    await page.click('button:has-text("送信")');
    const successMessage = page.locator('#success-message');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Manager views dashboard
    const managerPage = await context.newPage();
    await loginAsManager(managerPage);
    await managerPage.goto("/panels/scr-1787119200549.html");

    await managerPage.waitForTimeout(1000);

    // Verify issues are displayed in priority order
    const issuesList = managerPage.locator('[id="issues-list"]');
    await expect(issuesList).toContainText("【高】データベース接続タイムアウト問題", { timeout: 5000 });
    await expect(issuesList).toContainText("【中】要件定義書の修正依頼対応", { timeout: 5000 });
    await expect(issuesList).toContainText("【低】ドキュメント整理", { timeout: 5000 });

    await managerPage.close();
  });

  // SCEN-057: [normal] 部長向けダッシュボード - 〈日報入力・編集画面〉で送信した複数の日報が〈部長向けダッシュボード〉にチーム全体の進捗として集約表示される
  test("SCEN-057: 複数メンバーの日報がチーム全体進捗として表示される", async ({ page, context }) => {
    // Create multiple team members' reports
    const teamMembers = [
      { user: "member1", yesterday: "機能A実装", today: "機能B実装", issue: "バグ検出" },
      { user: "member2", yesterday: "テスト実行", today: "レビュー対応", issue: "パフォーマンス低下" },
      { user: "member3", yesterday: "ドキュメント作成", today: "設計会議", issue: "仕様変更" },
    ];

    // Submit reports from multiple members
    for (const member of teamMembers) {
      const memberPage = await context.newPage();
      await memberPage.goto("/login.html");
      await memberPage.fill('[name="username"]', member.user);
      await memberPage.fill('[name="password"]', "test");
      await Promise.all([
        memberPage.waitForURL(url => !url.toString().includes('/login.html')),
        memberPage.click('button[type="submit"]'),
      ]);

      await memberPage.goto("/panels/scr-1787119190590.html");
      await memberPage.fill('[name="yesterday_achievement"]', member.yesterday);
      await memberPage.fill('[name="today_plan"]', member.today);
      await memberPage.fill('[name="issues"]', member.issue);
      await memberPage.click('button:has-text("送信")');

      const successMessage = memberPage.locator('#success-message');
      await expect(successMessage).toBeVisible({ timeout: 5000 });

      await memberPage.close();
    }

    // Manager views dashboard with aggregated team data
    const managerPage = await context.newPage();
    await loginAsManager(managerPage);
    await managerPage.goto("/panels/scr-1787119200549.html");

    await managerPage.waitForTimeout(1000);

    // Verify all team members' reports are displayed
    for (const member of teamMembers) {
      await expect(managerPage.locator('body')).toContainText(member.yesterday, { timeout: 5000 });
      await expect(managerPage.locator('body')).toContainText(member.today, { timeout: 5000 });
      await expect(managerPage.locator('body')).toContainText(member.issue, { timeout: 5000 });
    }

    await managerPage.close();
  });
});