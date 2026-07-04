export const metadata = { title: "Privacy Policy · DailyOS" };

// Highlighted placeholder for details only the owner / solicitor can supply.
function Todo({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-amber-100 px-1 py-0.5 text-[13px] font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
      {children}
    </span>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <strong>Draft — pending legal review.</strong> This policy is structured
        to meet UK GDPR / Data Protection Act 2018 requirements, but items shown{" "}
        <Todo>like this</Todo> must be completed, and the whole document reviewed
        by a UK solicitor, before launch.
      </div>

      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="text-sm text-muted-foreground">Last updated: 3 July 2026</p>

      <p>
        This policy explains how DailyOS collects, uses and protects your
        personal data, and your rights under UK data protection law.
      </p>

      <h2>1. Who we are</h2>
      <ul>
        <li>Trading name: <strong>DailyOS</strong>.</li>
        <li>Operated by: <Todo>[legal entity name]</Todo>.</li>
        <li>Company number: <Todo>[company registration number, if a company]</Todo>.</li>
        <li>Registered in: <Todo>[England and Wales / other]</Todo>.</li>
        <li>Registered office: <Todo>[registered office address]</Todo>.</li>
        <li>VAT number: <Todo>[VAT number, if registered]</Todo>.</li>
        <li>Contact for privacy: <Todo>[contact email — to be added]</Todo>.</li>
        <li>Data Protection Officer: <Todo>[DPO name/contact, if appointed]</Todo>.</li>
      </ul>

      <h2>2. Our role</h2>
      <p>
        For personal accounts, DailyOS is the <strong>data controller</strong> —
        we decide how and why your data is processed (accounts, billing, support,
        analytics and app usage). If DailyOS is ever used on behalf of an
        organisation (a school, employer, family or team) we may act as a{" "}
        <strong>data processor</strong> for that organisation&rsquo;s data under a
        separate Data Processing Agreement.
      </p>

      <h2>3. What we collect</h2>
      <ul>
        <li><strong>Account information</strong> — email address, username, and login credentials (passwords are handled by our authentication provider and never stored by us in plain text).</li>
        <li><strong>Your content</strong> — tasks, notes, reminders, calendar events, routines, goals, preferences, Life Inbox entries, uploaded files, and anything you type into DailyOS.</li>
        <li><strong>Usage data</strong> — features used, interactions, session times, device and browser type, IP address (and approximate location derived from it), error logs and performance data.</li>
        <li><strong>Payment &amp; subscription data</strong> (when billing is live) — plan type, billing status, transaction and payment-processor customer IDs, and receipts. Full card numbers are handled by the payment processor, not by us.</li>
        <li><strong>Support &amp; communications</strong> — messages, feedback, bug reports and survey responses you send us.</li>
        <li><strong>Marketing data</strong> (if introduced) — subscription status and preferences.</li>
        <li><strong>Cookies &amp; local storage</strong> — see our <a href="/cookies">Cookie Policy</a>.</li>
      </ul>

      <h3>Special category (sensitive) data</h3>
      <p>
        DailyOS does <strong>not</strong> require you to provide sensitive data
        (such as health, religious or political information). Because DailyOS lets
        you type freely into notes and tasks, you could enter such data yourself —
        please only do so if you are comfortable. We do not intentionally offer
        features that require special category data.
      </p>

      <h2>4. Where we get data from</h2>
      <ul>
        <li>Directly from you, when you use DailyOS.</li>
        <li>Automatically from your device and browser.</li>
        <li>From our payment processor, when billing is live.</li>
        <li>From third-party login or integration providers, <em>only if</em> you connect them.</li>
      </ul>

      <h2>5. Why we use it, and our lawful basis</h2>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Purpose</th>
              <th>Lawful basis (UK GDPR)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Create and run your account; store and sync your content; deliver paid features</td><td>Contract</td></tr>
            <tr><td>Authenticate you and keep the service secure</td><td>Legitimate interests / Contract</td></tr>
            <tr><td>Process subscriptions, payments and invoices</td><td>Contract / Legal obligation (tax records)</td></tr>
            <tr><td>Provide customer support</td><td>Contract / Legitimate interests</td></tr>
            <tr><td>Fix bugs, monitor performance, analyse usage to improve DailyOS</td><td>Legitimate interests</td></tr>
            <tr><td>Send service messages (password resets, security, billing)</td><td>Contract / Legal obligation</td></tr>
            <tr><td>Send marketing (if introduced)</td><td>Consent</td></tr>
            <tr><td>Prevent fraud, abuse and misuse; enforce our Terms</td><td>Legitimate interests / Legal obligation</td></tr>
            <tr><td>Optional (non-essential) cookies</td><td>Consent</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Where we rely on <strong>legitimate interests</strong> (security, fraud
        prevention, analytics, product improvement, support and protecting our
        legal rights), we balance those interests against your rights.
      </p>

      <h2>6. AI features</h2>
      <p>
        Some features (organising your Life Inbox, planning your day, suggesting
        ideas) use AI. When AI is enabled, only the specific text needed for that
        request is sent to a third-party, OpenAI-compatible model provider to
        extract details or generate suggestions.
      </p>
      <p>
        The <strong>&ldquo;Ask DailyOS&rdquo; assistant</strong> works the same
        way, but to answer usefully it is also sent a short summary of your
        relevant DailyOS data — for example your upcoming tasks and events and a
        few recent notes — along with your message. This is used only to generate
        your answer for that request; it is not used to train any AI model.
      </p>
      <p>
        We do <strong>not</strong> use your content to train our own or third
        parties&rsquo; AI models. AI output can be inaccurate — always review it
        (nothing is saved to your tasks, calendar or vault until you approve it).
        If no AI provider is configured, this processing happens on-device with
        built-in logic and nothing is sent externally.
      </p>

      <h2>7. Automated decision-making</h2>
      <p>
        DailyOS does not make decisions that produce legal or similarly
        significant effects about you using solely automated processing.
      </p>

      <h2>8. Who we share data with</h2>
      <p>We share personal data only with service providers who help us run DailyOS, and only as needed:</p>
      <ul>
        <li><strong>Hosting</strong> — Vercel.</li>
        <li><strong>Database, auth &amp; file storage</strong> — Supabase.</li>
        <li><strong>AI provider</strong> — an OpenAI-compatible model provider, when AI features are enabled: <Todo>[named provider]</Todo>.</li>
        <li><strong>Payments</strong> (when live) — <Todo>[e.g. Stripe]</Todo>.</li>
        <li><strong>Email delivery</strong> (when live) — <Todo>[e.g. Resend]</Todo>.</li>
        <li>Professional advisers, and regulators / courts / law enforcement where legally required.</li>
        <li>A buyer or successor if DailyOS is sold or restructured.</li>
      </ul>
      <p>An up-to-date sub-processor list will be maintained at launch.</p>

      <h2>9. International transfers</h2>
      <p>
        Some providers may process data outside the UK (for example in the US).
        Where they do, we rely on an approved safeguard such as UK adequacy
        regulations, the UK International Data Transfer Agreement, or the UK
        Addendum to the EU Standard Contractual Clauses. <Todo>Confirm each
        provider&rsquo;s region and safeguard before launch.</Todo>
      </p>

      <h2>10. How long we keep it</h2>
      <ul>
        <li>Account data and your content — while your account is active.</li>
        <li>Deleted data / accounts — removed from live systems on deletion, and from backups within <Todo>[retention window]</Todo>.</li>
        <li>Payment and tax records — as required by law (typically 6 years).</li>
        <li>Support messages, security logs and analytics — <Todo>[retention periods]</Todo>.</li>
      </ul>

      <h2>11. Security</h2>
      <p>
        We use encryption in transit, row-level security so you can only access
        your own data, private file storage, authentication controls, limited
        admin access, backups, and monitoring. No system is perfectly secure, but
        we take these safeguards seriously and have a process to detect,
        investigate and, where required, report personal data breaches to the ICO
        within 72 hours and to affected users.
      </p>

      <h2>12. Your rights</h2>
      <p>Under UK GDPR you have the right to: access; rectification; erasure; restriction; objection; data portability; to withdraw consent (where processing relies on consent); and rights relating to automated decision-making. You can view, edit and permanently delete your data from <strong>Settings</strong>, or contact us to make a request.</p>

      <h2>13. Children</h2>
      <p>
        DailyOS is intended for adults and is not directed at children under 13,
        and we do not knowingly collect their data. <Todo>If children are likely
        to access DailyOS, complete an ICO Children&rsquo;s Code assessment before
        launch.</Todo>
      </p>

      <h2>14. Complaints</h2>
      <p>
        Please contact us first at <Todo>[contact email — to be added]</Todo>. You
        also have the right to complain to the Information Commissioner&rsquo;s
        Office (ICO) at{" "}
        <a href="https://ico.org.uk" target="_blank" rel="noreferrer">ico.org.uk</a>.
      </p>

      <h2>15. Changes</h2>
      <p>
        We may update this policy as the product evolves; material changes will be
        reflected here with a new &ldquo;last updated&rdquo; date.
      </p>
    </>
  );
}
