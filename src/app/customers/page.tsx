import { getHomeCustomers } from "@/actions/customer-actions";
import { getOdpNodes, getInventoryDevices } from "@/actions/infrastructure-actions";
import CustomersClientView from "@/components/customers/CustomersClientView";
import { DeviceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const currentYear = new Date().getFullYear();
  const [customers, odpNodes, devices] = await Promise.all([
    getHomeCustomers(currentYear),
    getOdpNodes(),
    getInventoryDevices(),
  ]);

  const availableDevices = devices.filter((d) => d.status === DeviceStatus.IN_STOCK);

  return (
    <CustomersClientView
      customers={customers}
      odpNodes={odpNodes}
      availableDevices={availableDevices}
      initialYear={currentYear}
    />
  );
}
