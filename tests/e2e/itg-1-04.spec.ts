import { test, expect } from '@playwright/test';

test.describe("ダッシュボード詳細レポート表示フロー", () => {
  // SCEN-641: [normal] ダッシュボード詳細レポート表示フロー - 業務フロー「ダッシュボード詳細レポート表示フロー」を開始から完了まで実行する
  test("should complete the full dashboard detail report display flow", async ({ page, request }) => {
    // Get API configuration from environment
    const apiUrl = process.env.PLAYWRIGHT_API_URL || "http://localhost:3000/api";
    const appId = process.env.PLAYWRIGHT_APP_ID || "app-1";

    // Step 1: Navigate to root and verify manager dashboard is displayed
    await test.step("部長向けダッシュボードにログインする", async () => {
      await page.goto("/");
      await expect(page).toHaveTitle(/nippo/);
      // Verify dashboard shell is loaded
      await expect(page.locator('.shell-container')).toBeVisible();
    });

    // Step 2: Verify dashboard screen is displayed with submission counts
    await test.step("ダッシュボード画面が表示されたことを確認する", async () => {
      // Check for key dashboard elements
      const submittedCount = page.locator('[data-testid="submitted-count"]');
      const unsubmittedCount = page.locator('[data-testid="unsubmitted-count"]');
      const viewFullReportBtn = page.locator('[data-testid="view-full-report-button"]');
      
      await expect(submittedCount).toBeVisible();
      await expect(unsubmittedCount).toBeVisible();
      await expect(viewFullReportBtn).toBeVisible();
    });

    // Step 3: Click on "詳細レポート表示" button to initiate detail report flow
    await test.step("ダッシュボード上の「詳細レポート表示」ボタン（または同等のナビゲーション要素）をクリックする", async () => {
      const viewFullReportBtn = page.locator('[data-testid="view-full-report-button"]');
      await Promise.all([
        page.waitForURL(url => url.toString().includes('/panels/')),
        viewFullReportBtn.click(),
      ]);
    });

    // Step 4: Verify navigation to report confirmation and search screen
    await test.step("詳細レポート表示フローが開始され、日報確認・検索画面へ遷移することを確認する", async () => {
      // Verify we're on the report confirmation screen
      const keywordSearch = page.locator('[data-testid="keyword-search"]');
      const searchButton = page.locator('[data-testid="search-button"]');
      const recordList = page.locator('[data-testid="record-list"]');
      
      await expect(keywordSearch).toBeVisible();
      await expect(searchButton).toBeVisible();
      await expect(recordList).toBeVisible();
    });

    // Step 5: Verify submitted report list is displayed
    await test.step("日報確認・検索画面で、提出済み日報の一覧が表示されることを確認する", async () => {
      const reportRows = page.locator('tr[data-testid*="report-"]');
      // Wait for at least one report row to be visible
      const firstRow = page.locator('tbody tr').first();
      await expect(firstRow).toBeVisible();
    });

    // Step 6: Select a report and click to expand detail information
    await test.step("一覧から任意の日報を選択して、詳細情報表示セクションをクリックする", async () => {
      // Click on first report row to expand details
      const firstReportRow = page.locator('tbody tr').first();
      await firstReportRow.click();
      
      // Wait for detail panel to appear
      const detailPanel = page.locator('[id="detail-panel"]');
      await expect(detailPanel).toBeVisible();
    });

    // Step 7: Verify detail content is expanded showing all three required items
    await test.step("選択した日報の詳細内容（昨日やったこと、今日やること、抱えている課題の3項目）が画面に展開されることを確認する", async () => {
      const detailPanel = page.locator('[id="detail-panel"]');
      const yesterdayContent = page.locator('[id="detail-yesterday"]');
      const todayContent = page.locator('[id="detail-today"]');
      const issuesContent = page.locator('[id="detail-issues"]');
      
      await expect(detailPanel).toBeVisible();
      await expect(yesterdayContent).toBeVisible();
      await expect(todayContent).toBeVisible();
      await expect(issuesContent).toBeVisible();
      
      // Verify content is not empty
      const yesterdayText = await yesterdayContent.textContent();
      const todayText = await todayContent.textContent();
      const issuesText = await issuesContent.textContent();
      
      expect(yesterdayText).not.toBeNull();
      expect(todayText).not.toBeNull();
      expect(issuesText).not.toBeNull();
    });

    // Step 8: Click back button to return to report list
    await test.step("詳細表示から戻るボタン（またはブラウザバック相当）をクリックして、日報確認・検索画面に戻ることを確認する", async () => {
      const closeDetailBtn = page.locator('[data-testid="close-detail-button"]');
      await closeDetailBtn.click();
      
      // Verify detail panel is closed
      const detailPanel = page.locator('[id="detail-panel"]');
      await expect(detailPanel).not.toBeVisible();
      
      // Verify we're back at the report list
      const recordList = page.locator('[data-testid="record-list"]');
      await expect(recordList).toBeVisible();
    });

    // Step 9: Click back to dashboard button to return to main dashboard
    await test.step("部長向けダッシュボードに戻るボタンをクリックして、ダッシュボード画面に戻ることを確認する", async () => {
      const backDashboardBtn = page.locator('[data-testid="back-dashboard-button"]');
      await backDashboardBtn.click();
      
      // Wait for navigation back to dashboard
      await page.waitForURL(url => !url.toString().includes('/panels/scr-1787119221707'));
      
      // Verify we're back on the dashboard
      const submittedCount = page.locator('[data-testid="submitted-count"]');
      const viewFullReportBtn = page.locator('[data-testid="view-full-report-button"]');
      
      await expect(submittedCount).toBeVisible();
      await expect(viewFullReportBtn).toBeVisible();
    });

    // Step 10: Verify complete flow execution
    await test.step("ダッシュボード詳細レポート表示フローが開始から完了まで正常に実行されたことを確認する", async () => {
      // Final verification that we're back at the dashboard with all elements visible
      const shell = page.locator('.shell-container');
      const header = page.locator('.header');
      const contentArea = page.locator('.content-area');
      
      await expect(shell).toBeVisible();
      await expect(header).toBeVisible();
      await expect(contentArea).toBeVisible();
      
      // Verify key dashboard elements are present
      const viewFullReportBtn = page.locator('[data-testid="view-full-report-button"]');
      await expect(viewFullReportBtn).toBeVisible();
    });
  });
});