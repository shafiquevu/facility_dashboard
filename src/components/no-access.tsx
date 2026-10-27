export function NoAccess() {
  return (
    <div className="panel mx-auto mt-10 max-w-md p-6 text-center">
      <h1 className="display text-lg font-semibold">This account can&apos;t open Facility Maintenance</h1>
      <p className="mt-2 text-[13px] text-graphite">
        Ask an administrator to give your dashboard account the maintenance role, then sign in again.
      </p>
    </div>
  );
}
