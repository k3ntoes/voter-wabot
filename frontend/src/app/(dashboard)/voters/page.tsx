import { VotersContent } from "@/components/dashboard/voters-content";
import { getAll } from "@/lib/dal/voters";

export default async function VotersPage() {
  const voters = await getAll();

  return <VotersContent initialVoters={voters} />;
}
