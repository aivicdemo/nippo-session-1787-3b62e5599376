import { test, expect } from '@playwright/test';

test.describe("日報確認・検索画面", () => {
  // SCEN-061: [normal] 日報確認・検索画面 - 朝会での報告内容確認・課題議論が最初から最後まで通り、記録が残る
  test("日報入力から検索・ダッシュボード反映までの完全フロー", async ({ page, request }) => {
    const uniqueYesterdayValue = "機能X実装完了_" + Date.now();
    const uniqueTodayValue = "機能Y開発開始_" + Date.now();
    const uniqueIssueValue = "DB接続タイムアウト課題_" + Date.now();

    // ===== ステップ 1: 開発エンジニアAが日報入力画面でログイン・入力・送信 =====
    await test.step("開発エンジニアAが日報入力フォームにアクセスしてログイン", async () => {
      await page.goto("/login.html");
      await page.fill('[name="username"]', 'engineer_a');
      await page.fill('[name="password"]', 'test');
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/login.html')),
        page.click('button[type="submit"]'),
      ]);
      await page.goto("/panels/scr-1787119190590.html");
      await expect(page.locator('[data-testid="yesterday-achievement-input"]')).toBeVisible({ timeout: 5000 });
    });

    // ===== ステップ 2: 日報データを入力・送信 =====
    await test.step("開発エンジニアAが3項目を入力して日報を送信", async () => {
      await page.fill('[data-testid="yesterday-achievement-input"]', uniqueYesterdayValue);
      await page.fill('[data-testid="today-plan-input"]', uniqueTodayValue);
      await page.fill('[data-testid="issues-input"]', uniqueIssueValue);
      
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/scr-1787119190590.html')),
        page.click('[data-testid="submit-button"]'),
      ]);
    });

    // ===== ステップ 3: 送信完了を確認（ダッシュボードへ自動遷移）=====
    await test.step("日報送信後、ダッシュボード画面に遷移したことを確認", async () => {
      await expect(page.locator('text=未提出')).toBeVisible({ timeout: 5000 });
    });

    // ===== ステップ 4: DBに記録されたことを確認 =====
    await test.step("送信した日報がDBの朝会報告テーブルに記録されていることを確認", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "朝会報告",
      );
      const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
      const rows = await res.json();
      expect(JSON.stringify(rows)).toContain(uniqueIssueValue);
    });

    // ===== ステップ 5: 開発エンジニアAが日報確認・検索画面で自分の提出済み日報を確認 =====
    await test.step("開発エンジニアAが日報確認・検索画面で自身の提出内容を確認", async () => {
      await page.goto("/panels/scr-1787119221707.html");
      await expect(page.locator('[data-testid="record-list"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="record-list"]')).toContainText(uniqueIssueValue);
    });

    // ===== ステップ 6: 開発部長がログイン・日報確認・検索画面でエンジニアA含む複数エンジニアの日報を確認 =====
    await test.step("開発部長がログインして日報確認・検索画面にアクセス", async () => {
      // 部長としてログイン
      await page.goto("/login.html");
      await page.fill('[name="username"]', 'manager');
      await page.fill('[name="password"]', 'test');
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/login.html')),
        page.click('button[type="submit"]'),
      ]);
      await page.goto("/panels/scr-1787119221707.html");
      await expect(page.locator('[data-testid="record-list"]')).toBeVisible({ timeout: 5000 });
    });

    await test.step("開発部長が複数エンジニアの提出状況を一覧で確認できることを検証", async () => {
      // 課題キーワード「DB接続タイムアウト課題」がリスト内に表示されていることを確認
      await expect(page.locator('[data-testid="record-list"]')).toContainText(uniqueIssueValue);
    });

    // ===== ステップ 7: 開発部長が検索機能を使用してキーワード「DB接続」で検索 =====
    await test.step("開発部長が検索機能でキーワード『DB接続』を検索", async () => {
      await page.fill('[data-testid="keyword-search"]', "DB接続");
      await page.click('[data-testid="search-button"]');
    });

    await test.step("検索結果にエンジニアAの日報が表示されることを確認", async () => {
      await expect(page.locator('[data-testid="record-list"]')).toContainText(uniqueIssueValue);
    });

    // ===== ステップ 8: プロジェクトマネージャーがログイン・日報確認・検索画面で全エンジニアの提出状況を確認 =====
    await test.step("プロジェクトマネージャーがログインして日報確認・検索画面にアクセス", async () => {
      await page.goto("/login.html");
      await page.fill('[name="username"]', 'project_manager');
      await page.fill('[name="password"]', 'test');
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/login.html')),
        page.click('button[type="submit"]'),
      ]);
      await page.goto("/panels/scr-1787119221707.html");
      await expect(page.locator('[data-testid="record-list"]')).toBeVisible({ timeout: 5000 });
    });

    await test.step("プロジェクトマネージャーが全エンジニアの提出状況一覧を確認", async () => {
      await expect(page.locator('[data-testid="record-list"]')).toContainText(uniqueIssueValue);
    });

    // ===== ステップ 9: 開発部長が部長向けダッシュボードにアクセスしてエンジニアAの報告が課題一覧に反映されていることを確認 =====
    await test.step("開発部長が部長向けダッシュボードにアクセス", async () => {
      await page.goto("/login.html");
      await page.fill('[name="username"]', 'manager');
      await page.fill('[name="password"]', 'test');
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/login.html')),
        page.click('button[type="submit"]'),
      ]);
      await page.goto("/panels/scr-1787119200549.html");
      await expect(page.locator('text=nippo')).toBeVisible({ timeout: 5000 });
    });

    await test.step("ダッシュボードの課題一覧にエンジニアAの『DB接続タイムアウト課題』が反映されていることを確認", async () => {
      // ダッシュボード上で課題リストが表示され、入力した課題キーワードが含まれることを確認
      await expect(page.locator('#issues-list')).toContainText(uniqueIssueValue);
    });

    // ===== ステップ 10: 最終確認として、DBに各テーブルのレコードが正しく保存されていることを検証 =====
    await test.step("最終確認: DB内の複数テーブルに記録が残っていることを検証", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      
      // 朝会報告テーブルで記録確認
      const reportTableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "朝会報告",
      );
      const reportRes = await request.get(`${apiUrl}/api/${reportTableIndex}?app=${appId}`);
      const reportRows = await reportRes.json();
      expect(JSON.stringify(reportRows)).toContain(uniqueIssueValue);
      expect(JSON.stringify(reportRows)).toContain(uniqueYesterdayValue);
      expect(JSON.stringify(reportRows)).toContain(uniqueTodayValue);
      
      // 課題抽出結果テーブルで記録確認
      const issueExtractTableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "課題抽出結果",
      );
      const issueRes = await request.get(`${apiUrl}/api/${issueExtractTableIndex}?app=${appId}`);
      const issueRows = await issueRes.json();
      expect(JSON.stringify(issueRows)).toContain(uniqueIssueValue);
    });
  });
});