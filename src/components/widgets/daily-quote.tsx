"use client";

import * as React from "react";
import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Well begun is half done.", author: "Aristotle" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese proverb" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "One day or day one. You decide.", author: "Paulo Coelho" },
  { text: "Your life does not get better by chance, it gets better by change.", author: "Jim Rohn" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "Be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha" },
  { text: "Every accomplishment starts with the decision to try.", author: "John F. Kennedy" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "If not now, when?", author: "Hillel" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Clarity precedes mastery.", author: "Robin Sharma" },
  { text: "Do less, but do it better.", author: "Unknown" },
  { text: "Chaos into clarity.", author: "DailyOS" },
  { text: "The obstacle is the way.", author: "Marcus Aurelius" },
  { text: "Inch by inch, life's a cinch. Yard by yard, life is hard.", author: "John Bytheway" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
];

function todayIndex(): number {
  const d = new Date();
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  return dayOfYear % QUOTES.length;
}

export function DailyQuoteWidget() {
  const q = QUOTES[todayIndex()];
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="pt-5">
        <Quote className="size-6 text-primary/40" />
        <blockquote className="mt-2 text-sm font-medium italic leading-relaxed">
          &ldquo;{q.text}&rdquo;
        </blockquote>
        <p className="mt-2 text-xs text-muted-foreground">&mdash; {q.author}</p>
      </CardContent>
    </Card>
  );
}
