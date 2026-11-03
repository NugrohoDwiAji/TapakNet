import { getUsers } from "@/actions/user-actions";
import UsersClientView from "@/components/users/UsersClientView";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await getUsers();

  return <UsersClientView users={users} />;
}
