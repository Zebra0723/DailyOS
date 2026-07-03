export const metadata = { title: "Terms of Service · DailyOS" };

export default function TermsPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        Terms of Service
      </h1>
      <p className="text-sm text-muted-foreground">Last updated: 3 July 2026</p>

      <p>
        These terms are an agreement between you and DailyOS. By creating an
        account or using the app, you agree to them. Please read them.
      </p>

      <h2>1. The service</h2>
      <p>
        DailyOS is a personal life-admin assistant that helps you turn everyday
        paperwork and reminders into tasks, calendar events and a searchable
        vault, alongside related tools. The service is provided on an
        &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis and is under
        active development.
      </p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for keeping your login details secure and for
        activity that happens under your account. Provide accurate information
        and let us know promptly of any unauthorised use.
      </p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>break the law or infringe others&rsquo; rights while using DailyOS;</li>
        <li>
          upload content you don&rsquo;t have the right to upload, or that is
          harmful or malicious;
        </li>
        <li>
          attempt to disrupt, reverse-engineer, or gain unauthorised access to
          the service or other users&rsquo; data.
        </li>
      </ul>

      <h2>4. Your content</h2>
      <p>
        You keep ownership of everything you add to DailyOS. You grant us only
        the limited permission needed to store, process and display that content
        back to you so the service can work (including, where enabled, sending
        the relevant text to an AI provider as described in our{" "}
        <a href="/privacy">Privacy Policy</a>).
      </p>

      <h2>5. Plans and billing</h2>
      <p>
        DailyOS offers Free, Plus and Pro tiers. Paid billing may not be active
        in all versions of the app; where promotional codes are used to unlock
        features, they may be changed or withdrawn. Any future paid plans will
        be described clearly before you are charged.
      </p>

      <h2>6. AI-generated content</h2>
      <p>
        Features that extract details, plan your day or make suggestions can be
        imperfect. Always review AI output before relying on it — DailyOS is
        designed so that nothing is saved to your tasks, calendar or vault until
        you approve it.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        We work hard to make DailyOS reliable, but we don&rsquo;t guarantee it
        will be uninterrupted or error-free, and we aren&rsquo;t liable for any
        loss arising from reliance on the service or on AI output. Nothing here
        limits liability that cannot be limited by law.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the extent permitted by law, DailyOS is not liable for indirect or
        consequential losses, or for loss of data, arising from your use of the
        service.
      </p>

      <h2>9. Termination</h2>
      <p>
        You can stop using DailyOS and delete your account at any time from
        Settings. We may suspend or end access if these terms are seriously or
        repeatedly breached.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these terms as the product evolves; the &ldquo;last
        updated&rdquo; date will change and continued use means you accept the
        revised terms.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href="mailto:support@dailyos.app">support@dailyos.app</a>.
      </p>
    </>
  );
}
