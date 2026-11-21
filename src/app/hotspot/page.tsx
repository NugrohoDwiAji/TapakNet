import { getHotspotPartners, getVoucherPackages } from "@/actions/voucher-actions";
import { getOdpOptions } from "@/actions/infrastructure-actions";
import HotspotClientView from "@/components/hotspot/HotspotClientView";

export const dynamic = "force-dynamic";

export default async function HotspotPage() {
  const [partners, packages, odpNodes] = await Promise.all([
    getHotspotPartners(),
    getVoucherPackages(),
    getOdpOptions(),
  ]);

  return <HotspotClientView partners={partners} packages={packages} odpNodes={odpNodes} />;
}
