import { getHotspotPartners, getVoucherPackages } from "@/actions/voucher-actions";
import { getOdpNodes } from "@/actions/infrastructure-actions";
import HotspotClientView from "@/components/hotspot/HotspotClientView";

export const dynamic = "force-dynamic";

export default async function HotspotPage() {
  const [partners, packages, odpNodes] = await Promise.all([
    getHotspotPartners(),
    getVoucherPackages(),
    getOdpNodes(),
  ]);

  return <HotspotClientView partners={partners} packages={packages} odpNodes={odpNodes} />;
}
