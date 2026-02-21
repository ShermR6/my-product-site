// app/account/create/page.tsx
export default function CreateAccountPage() {
  return (
    <>
      <h1>Create account</h1>
      <p>Placeholder account creation page.</p>

      <div className="panel-white" style={{ maxWidth: 520, marginTop: 18 }}>
        <div className="field">
          <label>Email</label>
          <input placeholder="Email" />
        </div>

        <div className="field">
          <label>Password</label>
          <input placeholder="Password" type="password" />
        </div>

        <button className="btn btn-outline" style={{ width: "100%" }}>
          Create account (placeholder)
        </button>
      </div>
    </>
  );
}