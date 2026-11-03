import { getRoleProfiles } from "@/actions/rbac-actions";
import RbacClientView from "@/components/rbac/RbacClientView";

export const dynamic = "force-dynamic";

export default async function RbacPage() {
  const roleProfiles = await getRoleProfiles();

  return <RbacClientView roleProfiles={roleProfiles} />;
}
