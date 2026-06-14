import { redirect } from "next/navigation";

export default function CreatorPage() {
  // Schickt jeden Benutzer sofort und unbemerkt zu den echten Kursen weiter!
  redirect("/creator/courses");
}