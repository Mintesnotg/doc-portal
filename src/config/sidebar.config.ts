import type { LucideIcon } from "lucide-react";
import {
  Shield,
  Users,
  KeyRound,
  LockKeyhole,
  FolderTree,
  FolderOpen,
  FileText,
  UserCog,
  ListChecks,
  ClockIcon,
  FolderClosedIcon,
  ShieldCheck,
} from "lucide-react";
export type SidebarItem = {
  name: string;
  route?: string;
  icon?: LucideIcon;
  permission?: string;
  children?: SidebarItem[];
};

export const sidebarConfig: SidebarItem[] = [
  {
    name: "Account Management",
    icon: Shield,
    permission: "view_account_management",
    children: [
      {
        name: "Users",
        route: "/users",
        icon: Users,
        permission: "view_users",
      },
      {
        name: "Roles",
        route: "/roles",
        icon: UserCog,
        permission: "view_roles",
      },
      {
        name: "Permissions",
        route: "/permissions",
        icon: LockKeyhole,
        permission: "view_permissions",
      },
    ],
  },
  {
    name: "Doc Management",
    icon: FolderTree,
    permission: "view_doc_management",
    children: [
      
      {
        name: "Doc Categories",
        icon: FolderClosedIcon,
        route: "/docs/categories",
        permission: "view_docs_categories",
      },
      {
        name: "HR Documents",
        icon: FolderOpen,
        permission: "view_hr_docs",
        children: [
          {
            name: "All HR Documents",
            route: "/docs/hr/",
            icon: FileText,
            permission: "view_requirement_doc",
          },
        ],
      },
      {
        name: "IT Documents",
        icon: ShieldCheck,
        permission: "view_it_docs",
        children: [
          {
            name: "All IT Documents",
            route: "/docs/it",
            icon: KeyRound,
            permission: "view_access_docs",
          },
        ],
      },
    ],
  },
];

// Local helper to avoid importing additional icons for a single use.
// function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       width="1em"
//       height="1em"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       {...props}
//     >
//       <circle cx="12" cy="12" r="10" />
//       <path d="m12 6 .01 6 4 2" />
//     </svg>
//   );
// }
