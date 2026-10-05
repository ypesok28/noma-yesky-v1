import { redirect } from "next/navigation";

// Login is disabled for now, so send everyone straight to the upload page
export default function Page() {
  redirect("/upload");
}
