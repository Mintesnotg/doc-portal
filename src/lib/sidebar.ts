import type { SidebarItem } from "@/config/sidebar.config";

export function filterSidebar(
  items: SidebarItem[],
  userPermissions: string[],
): SidebarItem[] {
  return items
    .map((item) => {
      if (item.children) {
        const filteredChildren = filterSidebar(item.children, userPermissions);

        if (filteredChildren.length > 0) {
          return { ...item, children: filteredChildren };
        }
      }

      if (!item.permission || userPermissions.includes(item.permission)) {
        return item;
      }

      return null;
    })
    .filter(Boolean) as SidebarItem[];
}
