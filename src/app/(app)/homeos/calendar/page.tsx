import { redirect } from "next/navigation";

// The HomeOS calendar is now merged into the single LifeOS Calendar.
export default function HomeCalendarPage() {
  redirect("/calendar");
}
