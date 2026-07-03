export const metadata = { title: "Privacy Policy · DailyOS" };

export default function PrivacyPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="text-sm text-muted-foreground">Last updated: 3 July 2026</p>

      <p>
        DailyOS (&ldquo;we&rdquo;, &ldquo;us&rdquo;) helps you organise life
        admin. This policy explains what we collect, why, and the choices you
        have. We&rsquo;ve tried to keep it plain and honest.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong> — your email address and, if you set
          one, a username. Passwords are handled by our authentication provider
          and are never stored by us in plain text.
        </li>
        <li>
          <strong>Content you add</strong> — the text, notes, tasks, events and
          files (receipts, PDFs, images) you put into DailyOS so it can organise
          them for you.
        </li>
        <li>
          <strong>Basic technical data</strong> — standard information your
          browser sends (such as device and connection details) needed to serve
          the app securely.
        </li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal data, and we do not use it
        for advertising.
      </p>

      <h2>How your data is stored and protected</h2>
      <p>
        Your data is stored with{" "}
        <a href="https://supabase.com" target="_blank" rel="noreferrer">
          Supabase
        </a>{" "}
        (Postgres, Auth and Storage). Every database table is protected by
        row-level security so you can only ever read or write your own rows, and
        uploaded files live in private storage reachable only by you through
        short-lived signed links.
      </p>

      <h2>AI processing</h2>
      <p>
        When AI features are enabled, the specific text you ask DailyOS to
        process (for example an item you drop into the Life Inbox) is sent to a
        third-party, OpenAI-compatible model provider to extract details such as
        dates, tasks and summaries. Only the content needed for that request is
        sent. If no AI provider is configured, this processing happens on-device
        with built-in logic and nothing is sent externally.
      </p>

      <h2>Cookies</h2>
      <p>
        We use a small number of strictly necessary cookies to keep you signed
        in and to remember preferences such as light or dark mode. We do not use
        third-party tracking or advertising cookies.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>
          <strong>Access &amp; edit</strong> — everything you add is visible and
          editable inside the app.
        </li>
        <li>
          <strong>Delete</strong> — you can delete all your data, or your entire
          account, at any time from <strong>Settings</strong>. Deletion is
          permanent.
        </li>
      </ul>

      <h2>Data retention</h2>
      <p>
        We keep your data for as long as your account is active. When you delete
        your data or account, it is removed from our systems.
      </p>

      <h2>Children</h2>
      <p>
        DailyOS is not directed at children under 13, and we do not knowingly
        collect their data.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy as the product evolves. Material changes will
        be reflected here with a new &ldquo;last updated&rdquo; date.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email{" "}
        <a href="mailto:support@dailyos.app">support@dailyos.app</a>.
      </p>
    </>
  );
}
