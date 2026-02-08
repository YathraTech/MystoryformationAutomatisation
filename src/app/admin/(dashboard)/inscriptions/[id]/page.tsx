import InscriptionDetail from '@/components/admin/InscriptionDetail';

export default async function InscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <InscriptionDetail id={id} />;
}
