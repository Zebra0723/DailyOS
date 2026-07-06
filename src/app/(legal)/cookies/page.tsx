export const metadata = { title: "Cookie Policy · DailyOS" };

export default function CookiesPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        Cookie Policy
      </h1>
      <p className="text-sm text-muted-foreground">Last updated: 6 July 2026</p>

      <p>
        This explains the cookies and similar technologies (like browser local
        storage) that DailyOS uses.
      </p>

      <h2>What we currently use</h2>
      <p>
        DailyOS currently uses only <strong>strictly necessary</strong>{" "}
        technologies — the ones needed to sign you in and remember your basic
        preferences. These don&rsquo;t require consent because the app can&rsquo;t
        work without them.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Name / type</th>
              <th>Purpose</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase auth cookies</td>
              <td>Keep you securely signed in</td>
              <td>Strictly necessary</td>
            </tr>
            <tr>
              <td>Session length (cookie: dailyos-session-deadline)</td>
              <td>Remember how long to keep you signed in (your &ldquo;Remember me&rdquo; choice)</td>
              <td>Strictly necessary</td>
            </tr>
            <tr>
              <td>Timezone (cookie: dailyos-tz)</td>
              <td>Show your dates and times in your own timezone</td>
              <td>Strictly necessary</td>
            </tr>
            <tr>
              <td>Theme preference (local storage)</td>
              <td>Remember light / dark mode</td>
              <td>Strictly necessary</td>
            </tr>
            <tr>
              <td>App data (local storage)</td>
              <td>Store some features (e.g. HomeOS, plan status, wellbeing streaks) on your device</td>
              <td>Strictly necessary</td>
            </tr>
            <tr>
              <td>Cookie choice (local storage)</td>
              <td>Remember your cookie preference</td>
              <td>Strictly necessary</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Optional cookies</h2>
      <p>
        We do <strong>not</strong> currently use analytics or marketing cookies.
        If we add them, we will ask for your consent first through a cookie
        banner, and rejecting them will be as easy as accepting. You&rsquo;ll be
        able to change your choice at any time. Non-essential cookies will not be
        set until you agree.
      </p>

      <h2>Managing cookies</h2>
      <p>
        You can clear or block cookies in your browser settings, though the app
        may not work properly without the strictly necessary ones.
      </p>

      <h2>More information</h2>
      <p>
        See our <a href="/privacy">Privacy Policy</a> for how we handle personal
        data.
      </p>
    </>
  );
}
