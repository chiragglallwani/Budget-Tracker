import { SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/navigation/AppSidebar";

export default function PageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full">
      <AppSidebar />
      <main className="flex-1 w-full">
        <SidebarTrigger />
        <div className="mx-8 mb-12">{children}</div>
      </main>
    </div>
  );
}
