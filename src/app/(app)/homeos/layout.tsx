import { HomeOSShell } from "@/components/homeos/homeos-app";

export const metadata = { title: "HomeOS · DailyOS" };

export default function HomeOSLayout({ children }: { children: React.ReactNode }) {
  return <HomeOSShell>{children}</HomeOSShell>;
}
