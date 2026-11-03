import { getTopologyData } from "@/actions/topology-actions";
import TopologyClientView from "@/components/topology/TopologyClientView";

export const dynamic = "force-dynamic";

export default async function TopologyPage() {
  const result = await getTopologyData();

  if (!result.success || !result.data) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
        <h3 className="font-bold text-base text-rose-600">Gagal Memuat Topologi</h3>
        <p className="text-xs text-slate-500">
          {result.error || "Terjadi kesalahan saat memproses data topologi jaringan."}
        </p>
      </div>
    );
  }

  return <TopologyClientView initialData={result.data} />;
}
