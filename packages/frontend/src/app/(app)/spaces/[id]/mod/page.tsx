import { redirect } from "next/navigation";

export default async function ModIndexPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/spaces/${id}/mod/settings`);
}
