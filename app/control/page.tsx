import { redirect } from "next/navigation";

export default function ControlPage() {
  redirect("/library?type=music");
}
