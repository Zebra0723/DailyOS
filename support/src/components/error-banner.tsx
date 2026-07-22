import { friendlyError } from "@/lib/feedback";

/** Warm, non-alarming banner used on every data page when a read fails
 *  (most often because the feedback table hasn't been created yet). */
export function ErrorBanner({ error }: { error: string }) {
  return (
    <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
      {friendlyError(error)}
    </div>
  );
}
