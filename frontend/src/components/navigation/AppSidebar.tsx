import {
  HandCoinsIcon,
  Layers3Icon,
  LayoutDashboardIcon,
  LogOutIcon,
  ShoppingBagIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const items = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Transactions Overview",
      url: "/transactions-overview",
      icon: Layers3Icon,
    },
    {
      title: "Transaction Management",
      url: "/transaction-management",
      icon: HandCoinsIcon,
    },
    {
      title: "Budget Management",
      url: "/budget-management",
      icon: ShoppingBagIcon,
    },
  ];
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Budget Tracker</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    asChild
                    isActive={pathname === item.url}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton
          className="hover:cursor-pointer"
          onClick={() => logout()}
          asChild
        >
          <div>
            <LogOutIcon />
            <span>Logout</span>
          </div>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
