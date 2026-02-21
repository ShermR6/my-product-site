// app/login/page.tsx
import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      <h1>Log in</h1>
      <p>Placeholder login form. You’ll connect authentication later.</p>

      <div className="panel-white" style={{ maxWidth: 520, marginTop: 18 }}>
        <div className="field">
          <label>Email</label>
          <input placeholder="Email" />
        </div>

        <div className="field">
          <label>Password</label>
          <input placeholder="Password" type="password" />
        </div>

        <button className="btn btn-solid" style={{ width: "100%" }}>
          Log in (placeholder)
        </button>

        <div className="note">
          Don’t have an account? <Link href="/account/create">Create one</Link>
        </div>
      </div>
    </>
  );
}