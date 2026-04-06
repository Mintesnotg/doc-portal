import UsersTable from "./users-table";

export default function UsersPage() {
  return (
    <section className="space-y-6 p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          This page now uses a reusable TanStack table scaffold. You can reuse the same component
          for documents, categories, roles, and permissions by swapping the row type and column
          definitions.
        </p>
      </div>

      <UsersTable />
    </section>
  );
}
