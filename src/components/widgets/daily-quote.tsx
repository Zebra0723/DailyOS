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
  // Winston Churchill
  { text: "If you're going through hell, keep going.", author: "Winston Churchill" },
  { text: "We make a living by what we get, but we make a life by what we give.", author: "Winston Churchill" },
  { text: "Attitude is a little thing that makes a big difference.", author: "Winston Churchill" },
  { text: "The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.", author: "Winston Churchill" },
  { text: "Continuous effort — not strength or intelligence — is the key to unlocking our potential.", author: "Winston Churchill" },
  // Dr Seuss
  { text: "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.", author: "Dr Seuss" },
  { text: "Why fit in when you were born to stand out?", author: "Dr Seuss" },
  { text: "Today you are you, that is truer than true. There is no one alive who is youer than you.", author: "Dr Seuss" },
  { text: "Unless someone like you cares a whole awful lot, nothing is going to get better. It's not.", author: "Dr Seuss" },
  { text: "Sometimes you will never know the value of a moment until it becomes a memory.", author: "Dr Seuss" },
  // Albert Einstein
  { text: "Imagination is more important than knowledge.", author: "Albert Einstein" },
  { text: "Life is like riding a bicycle. To keep your balance, you must keep moving.", author: "Albert Einstein" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "The measure of intelligence is the ability to change.", author: "Albert Einstein" },
  // Steve Jobs
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "The people who are crazy enough to think they can change the world are the ones who do.", author: "Steve Jobs" },
  // Maya Angelou
  { text: "We delight in the beauty of the butterfly, but rarely admit the changes it has gone through to achieve that beauty.", author: "Maya Angelou" },
  { text: "If you don't like something, change it. If you can't change it, change your attitude.", author: "Maya Angelou" },
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
  // Seneca
  { text: "It is not that we have a short time to live, but that we waste a great deal of it.", author: "Seneca" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  // Lao Tzu
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "When I let go of what I am, I become what I might be.", author: "Lao Tzu" },
  // Epictetus
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus" },
  // Others
  { text: "What we fear doing most is usually what we most need to do.", author: "Ralph Waldo Emerson" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Hard choices, easy life. Easy choices, hard life.", author: "Jerzy Gregorek" },
  { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Knowing is not enough; we must apply. Wishing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
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
