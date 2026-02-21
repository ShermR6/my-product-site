// app/pricing/page.tsx
import PricingTabs from "./PricingTabs";

export default function PricingPage() {
  return (
    <main className="page">
      <div className="container">
        <PricingTabs />
      </div>
    </main>
  );
}

        {/* PERSONAL */}
        <section style={{ marginTop: 22 }}>
          <h2 className="section-title">Personal</h2>
          <p className="section-sub">For individuals tracking flights and getting alerts.</p>

          <div className="grid-3">
            <div className="panel-white">
              <h2>Starter</h2>
              <div style={{ fontSize: 28, fontWeight: 800 }}>$9</div>
              <p className="small">per month</p>
              <ul>
                <li>Track up to 3 aircraft</li>
                <li>1 saved coordinate</li>
                <li>Basic distance alerts</li>
              </ul>
              <div className="btn-row">
                <button className="btn btn-solid">Buy Starter (Stripe later)</button>
              </div>
            </div>

            <div className="panel-white">
              <h2>Plus</h2>
              <div style={{ fontSize: 28, fontWeight: 800 }}>$19</div>
              <p className="small">per month</p>
              <ul>
                <li>Track up to 10 aircraft</li>
                <li>5 saved coordinates</li>
                <li>Smart alerts + filters</li>
              </ul>
              <div className="btn-row">
                <button className="btn btn-outline">Buy Plus (Stripe later)</button>
              </div>
            </div>

            <div className="panel-white">
              <h2>Pro</h2>
              <div style={{ fontSize: 28, fontWeight: 800 }}>$39</div>
              <p className="small">per month</p>
              <ul>
                <li>Unlimited aircraft</li>
                <li>Unlimited coordinates</li>
                <li>Advanced alert rules</li>
              </ul>
              <div className="btn-row">
                <button className="btn btn-outline">Buy Pro (Stripe later)</button>
              </div>
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section style={{ marginTop: 28 }}>
          <h2 className="section-title">Team</h2>
          <p className="section-sub">For groups managing shared tracking and alerts.</p>

          <div className="grid-3">
            <div className="panel-white">
              <h2>Team Starter</h2>
              <div style={{ fontSize: 28, fontWeight: 800 }}>$49</div>
              <p className="small">per month</p>
              <ul>
                <li>Up to 5 seats</li>
                <li>Shared lists + coordinates</li>
                <li>Standard support</li>
              </ul>
              <div className="btn-row">
                <button className="btn btn-solid">Buy Team Starter (Stripe later)</button>
              </div>
            </div>

            <div className="panel-white">
              <h2>Team Plus</h2>
              <div style={{ fontSize: 28, fontWeight: 800 }}>$99</div>
              <p className="small">per month</p>
              <ul>
                <li>Up to 15 seats</li>
                <li>Roles/permissions</li>
                <li>Priority support</li>
              </ul>
              <div className="btn-row">
                <button className="btn btn-outline">Buy Team Plus (Stripe later)</button>
              </div>
            </div>

            <div className="panel-white">
              <h2>Team Pro</h2>
              <div style={{ fontSize: 28, fontWeight: 800 }}>$199</div>
              <p className="small">per month</p>
              <ul>
                <li>Unlimited seats</li>
                <li>Org controls + audit logs</li>
                <li>Dedicated support</li>
              </ul>
              <div className="btn-row">
                <button className="btn btn-outline">Buy Team Pro (Stripe later)</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}