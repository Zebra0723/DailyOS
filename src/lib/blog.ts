// Blog post index — metadata only, used by the /blog listing and the sitemap.
// Each post's content lives in its own page under src/app/blog/<slug>/.

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  readingTime: string;
}

export const POSTS: PostMeta[] = [
  {
    slug: "how-to-cancel-subscriptions-you-forgot-about",
    title: "How to find and cancel the subscriptions you forgot you're paying for",
    description:
      "A simple step-by-step way to uncover every subscription draining your account — including the ones you've completely forgotten — and cancel the ones you don't use.",
    date: "2026-08-21",
    readingTime: "5 min read",
  },
  {
    slug: "never-miss-a-renewal-again",
    title: "Never miss a renewal again: a simple system for trials, insurance and warranties",
    description:
      "Free trials, insurance auto-renewals and lapsing warranties quietly cost you money. Here's a simple, no-app system to stay ahead of every date — and how to automate it.",
    date: "2026-08-21",
    readingTime: "6 min read",
  },
];

export function getPost(slug: string): PostMeta | undefined {
  return POSTS.find((p) => p.slug === slug);
}
