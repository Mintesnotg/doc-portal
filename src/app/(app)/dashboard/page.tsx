export default function DashboardPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900">Welcome!</h2>
        <p className="mt-2 text-slate-600 text-sm leading-relaxed">
          You have successfully signed in. This dashboard screen is ready for widgets and will
          inherit future sidebar navigation without changing the login flow.
        </p>
      </div>
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
        <h3 className="text-base font-semibold">Next steps</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li>• Wire this page to protected routes once auth guard is added.</li>
          <li>• Replace this panel with your real dashboard metrics.</li>
          <li>• Connect sidebar layout when navigation is ready.</li>
        </ul>
      </div>
    </div>
  );
}
