import { redirect } from "next/navigation";

// The API has no team-management endpoint. Keep old bookmarks useful.
export default function UsersPage() {
  redirect("/dashboard/settings");
}
