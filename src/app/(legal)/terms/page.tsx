export const metadata = { title: "Terms of Service · DailyOS" };

function Todo({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-amber-100 px-1 py-0.5 text-[13px] font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
      {children}
    </span>
  );
}

export default function TermsPage() {
  return (
    <>
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <strong>Draft — pending legal review.</strong> These terms are structured
        to meet UK consumer and e-commerce requirements, but items shown{" "}
        <Todo>like this</Todo> must be completed, and the whole document reviewed
        by a UK solicitor, before launch.
      </div>

      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        Terms of Service
      </h1>
      <p className="text-sm text-muted-foreground">Last updated: 3 July 2026</p>

      <h2>1. Who we are</h2>
      <ul>
        <li>Trading name: <strong>DailyOS</strong>.</li>
        <li>Operated by: <Todo>[legal entity name]</Todo>, company no. <Todo>[number]</Todo>, registered in <Todo>[England and Wales]</Todo>.</li>
        <li>Registered office: <Todo>[address]</Todo>. VAT: <Todo>[VAT number, if registered]</Todo>.</li>
        <li>Contact: <Todo>[contact email — to be added]</Todo>.</li>
      </ul>

      <h2>2. Acceptance</h2>
      <p>
        By creating an account, subscribing, or using DailyOS you agree to these
        Terms. If you do not agree, do not use DailyOS. Our{" "}
        <a href="/privacy">Privacy Policy</a> and <a href="/cookies">Cookie Policy</a>{" "}
        are separate documents that form part of your agreement with us. Extra
        terms may apply to paid plans, beta features or integrations.
      </p>

      <h2>3. Eligibility &amp; age</h2>
      <p>
        You must be at least 18 (or <Todo>[minimum age]</Todo>) to use DailyOS,
        and legally able to enter into this agreement. You must provide accurate
        account information. DailyOS is not intended for children under 13.
      </p>

      <h2>4. Your account</h2>
      <p>
        Keep your login details secure; you are responsible for activity under
        your account. Tell us promptly of any unauthorised use. We may suspend or
        close accounts that breach these Terms.
      </p>

      <h2>5. The service</h2>
      <p>
        DailyOS is a personal life-admin assistant: capture (Life Inbox), tasks,
        calendar, a searchable vault, day planning, interests, wellbeing tools,
        HomeOS, and AI-assisted organisation. It is provided &ldquo;as is&rdquo;
        and is under active development; features may change, be added or removed.
      </p>

      <h2>6. Plans, prices &amp; payment</h2>
      <p>When paid plans are live:</p>
      <ul>
        <li>Prices are shown in <Todo>[GBP]</Todo>, and whether they include VAT will be stated at checkout.</li>
        <li>Subscriptions are billed <Todo>[monthly/annually]</Todo> and, unless cancelled, <strong>renew automatically</strong>. You can cancel renewal at any time in Settings.</li>
        <li>Payment is taken via <Todo>[payment processor, e.g. Stripe]</Todo> at the start of each period.</li>
        <li>We&rsquo;ll tell you before any price change; you can cancel if you disagree.</li>
        <li>Failed payments may lead to loss of paid features.</li>
      </ul>

      <h2>7. Free trials</h2>
      <p>
        Where offered, we&rsquo;ll state the trial length, what&rsquo;s included,
        whether payment details are needed, and when (and how to avoid) being
        charged if it converts to a paid plan.
      </p>

      <h2>8. Your cancellation &amp; refund rights</h2>
      <p>
        As a UK consumer you normally have a <strong>14-day cooling-off period</strong>{" "}
        to cancel a purchase. Because DailyOS is a digital service you can use
        immediately, if you ask us to start it during that period you acknowledge
        you may lose the right to cancel once it has begun. Nothing here affects
        your statutory rights. To cancel a subscription, use Settings; access
        continues until the end of the paid period. <Todo>Confirm the refund
        policy (pro-rata, none, etc.) with your solicitor.</Todo>
      </p>

      <h2>9. Your content</h2>
      <p>
        You keep ownership of everything you add to DailyOS. You grant us a
        limited licence to host, store, back up, process and display that content
        solely to operate the service; that licence ends when you delete the
        content (subject to backups and legal retention). You must have the rights
        to any content you upload and are responsible for it.
      </p>

      <h2>10. Acceptable use</h2>
      <p>You must not:</p>
      <ul>
        <li>use DailyOS unlawfully or to infringe others&rsquo; rights;</li>
        <li>hack, disrupt, scrape, or attempt unauthorised access;</li>
        <li>upload malware or unlawful, harmful or infringing content;</li>
        <li>impersonate others, commit fraud, or send spam;</li>
        <li>reverse-engineer the service (except where the law permits);</li>
        <li>bypass usage limits or payment, or misuse AI features.</li>
      </ul>

      <h2>11. AI features</h2>
      <ul>
        <li>AI output may be inaccurate and is <strong>not</strong> legal, medical, financial or other professional advice.</li>
        <li>You are responsible for decisions you make using AI output; review it before relying on it.</li>
        <li>
          The &ldquo;Ask DailyOS&rdquo; assistant uses AI and, to answer, is sent
          a summary of your relevant DailyOS data along with your message, as
          described in our <a href="/privacy">Privacy Policy</a>. It can suggest
          adding tasks, events or notes, but nothing is saved until you confirm.
        </li>
        <li>AI features may have usage limits, and prompts/outputs are handled as described in our <a href="/privacy">Privacy Policy</a>.</li>
        <li>Do not submit content you don&rsquo;t have the right to use, or use AI for illegal or harmful purposes.</li>
      </ul>

      <h2>12. Third-party integrations</h2>
      <p>
        If you connect third-party services, you are responsible for complying
        with their terms. We are not responsible for their outages or changes, and
        disconnecting an integration may reduce functionality.
      </p>

      <h2>13. Availability, backups &amp; data</h2>
      <p>
        We aim for a reliable service but do not guarantee it will be
        uninterrupted; maintenance and outages can occur, and beta features may be
        unstable. We keep backups, but please keep your own copies of important
        content. You can delete your data from Settings.
      </p>

      <h2>14. Intellectual property</h2>
      <p>
        DailyOS and its brand, logo, design, software and platform content belong
        to us. You get a limited, non-transferable licence to use DailyOS; you may
        not copy, resell, modify or exploit it, or use our trademarks, without
        permission. If you send feedback, we may use it without obligation.
      </p>

      <h2>15. Suspension &amp; termination</h2>
      <p>
        You can close your account at any time. We may suspend or terminate access
        for breach, security, fraud, non-payment or legal risk. Terms that by
        their nature should survive (IP, liability, payment, governing law) will
        survive termination.
      </p>

      <h2>16. Your consumer rights</h2>
      <p>
        Nothing in these Terms affects your statutory rights as a consumer. Digital
        content and services must match their description, be fit for purpose and
        of satisfactory quality; you may have remedies under UK consumer law.
      </p>

      <h2>17. Liability</h2>
      <p>
        To the extent permitted by law, we are not liable for indirect or
        consequential loss, lost profits or goodwill, loss of data, or loss caused
        by third-party services or outages or your misuse. We do{" "}
        <strong>not</strong> exclude liability for death or personal injury caused
        by our negligence, for fraud, or for anything that cannot legally be
        excluded, and we do not limit your non-excludable consumer rights.
      </p>

      <h2>18. Disclaimers</h2>
      <p>
        DailyOS is a productivity tool, not professional advice, and does not
        guarantee specific results. To the extent the law allows, we are not
        responsible for missed tasks, reminders or deadlines where you relied
        solely on the app.
      </p>

      <h2>19. Governing law</h2>
      <p>
        These Terms are governed by the law of <Todo>[England and Wales]</Todo>,
        and the courts of <Todo>[England and Wales]</Todo> have jurisdiction.
        Consumers may still benefit from mandatory rights in their own country.
      </p>

      <h2>20. App stores</h2>
      <p>
        If you download DailyOS from the Apple App Store or Google Play, their
        terms also apply; the app store may handle purchases, refunds and
        subscription cancellation, and is not responsible for DailyOS support
        except as its terms state.
      </p>

      <h2>21. Changes &amp; contact</h2>
      <p>
        We may update these Terms; we&rsquo;ll notify you of material changes and
        show a new &ldquo;last updated&rdquo; date. Questions or complaints:{" "}
        <Todo>[contact email — to be added]</Todo>.
      </p>
    </>
  );
}
