import {
  getRouterDevices,
  getIspProviders,
  getOltDevices,
  getOdpNodes,
  getInventoryDevices,
} from "@/actions/infrastructure-actions";
import InfrastructureClientView from "@/components/infrastructure/InfrastructureClientView";

export const dynamic = "force-dynamic";

export default async function InfrastructurePage() {
  const [routers, isps, olts, odps, devices] = await Promise.all([
    getRouterDevices(),
    getIspProviders(),
    getOltDevices(),
    getOdpNodes(),
    getInventoryDevices(),
  ]);

  return (
    <InfrastructureClientView
      routers={routers}
      isps={isps}
      olts={olts}
      odps={odps}
      devices={devices}
    />
  );
}
