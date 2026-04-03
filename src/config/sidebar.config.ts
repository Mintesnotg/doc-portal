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
  ShieldCheck,
} from "lucide-react";
import type React from "react";

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
        name: "HR Documents",
        icon: FolderOpen,
        permission: "view_hr_docs",
        children: [
          {
            name: "Requirement Docs",
            route: "/docs/hr/requirements",
            icon: FileText,
            permission: "view_requirement_doc",
          },
          {
            name: "Employee Benefit Docs",
            route: "/docs/hr/benefits",
            icon: ListChecks,
            permission: "view_benefit_docs",
          },
          {
            name: "Time Management Docs",
            route: "/docs/hr/time",
            icon: ClockIcon,
            permission: "view_time_docs",
          },
        ],
      },
      {
        name: "IT Documents",
        icon: ShieldCheck,
        permission: "view_it_docs",
        children: [
          {
            name: "User Access Docs",
            route: "/docs/it/access",
            icon: KeyRound,
            permission: "view_access_docs",
          },
          {
            name: "List of Application Docs",
            route: "/docs/it/apps",
            icon: ListChecks,
            permission: "view_apps_docs",
          },
          {
            name: "Security Docs",
            route: "/docs/it/security",
            icon: ShieldCheck,
            permission: "view_security_docs",
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
