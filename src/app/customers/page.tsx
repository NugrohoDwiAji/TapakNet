import { getHomeCustomers } from "@/actions/customer-actions";
import { getOdpNodes, getAvailableDevices } from "@/actions/infrastructure-actions";
import CustomersClientView from "@/components/customers/CustomersClientView";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const currentYear = new Date().getFullYear();
  const [customers, odpNodes, availableDevices] = await Promise.all([
    getHomeCustomers(currentYear),
    getOdpNodes(),
    getAvailableDevices(),
  ]);

  return (
    <CustomersClientView
      customers={customers}
      odpNodes={odpNodes}
      availableDevices={availableDevices}
      initialYear={currentYear}
    />
  );
}
