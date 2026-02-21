import Link from "next/link";

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Account</h1>
      <p className="text-neutral-700">Choose where you want to go:</p>

      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Log in
        </Link>

        <Link
          href="/account/create"
          className="rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-50"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}