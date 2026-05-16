import Nav from "../components/Nav";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import HotelCard from "../components/HotelCard";
import HomeHero from "../components/HomeHero";
import Icon from "../components/Icon";
import { getFeaturedHotels } from "../lib/api";

export default async function HomePage() {
  const featured = await getFeaturedHotels({ lang: "en" });

  return (
    <>
      <Nav overHero />
      <HomeHero />

      {/* TRUST BAR */}
      <div className="nz-trustbar">
        <div className="wrap nz-trustbar-inner">
          {[
            ["10", "Verified hotels"],
            ["8", "Cities across Algeria"],
            ["5s", "To confirmed booking"],
            ["4.9", "Average guest rating"],
            ["24/7", "WhatsApp support"],
          ].map(([big, lbl], i) => (
            <div className="nz-tstat" key={i}>
              <div className="big display">{big}</div>
              <div className="lbl">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURED HOTELS */}
      <section className="wrap nz-section">
        <div className="nz-section-head">
          <div>
            <div className="nz-kicker">The Collection</div>
            <h2 className="display">Hotels Algerians love</h2>
            <p>Hand-selected and verified by Allouni Travel Agency</p>
          </div>
          <a href="/hotels" className="nz-viewall">
            All 10 hotels <Icon name="arrow" size={15} strokeWidth={2.5} />
          </a>
        </div>
        <div className="nz-hotels-grid">
          {featured.map((h) => (
            <HotelCard key={h.id} hotel={h} />
          ))}
        </div>
      </section>

      {/* WHY NZZOR */}
      <section className="nz-why" id="how">
        <div className="wrap">
          <div className="nz-section-head">
            <div>
              <div className="nz-kicker">Why Nzzor</div>
              <h2 className="display">The trust of an agency,<br />the speed of an app</h2>
            </div>
          </div>
          <div className="nz-bento">
            <div className="nz-bento-card feature">
              <div className="nz-bento-icon"><Icon name="shield" size={30} /></div>
              <div>
                <h3 className="display">Backed by Allouni</h3>
                <p>A licensed Algerian travel agency authorized by the Ministry of Tourism. We&apos;re not a startup — we&apos;re an institution going digital.</p>
              </div>
            </div>
            <div className="nz-bento-card">
              <div className="nz-bento-icon"><Icon name="clock" size={22} /></div>
              <div>
                <h3 className="display">Instant confirmation</h3>
                <p>Confirmed in seconds. No waiting, no &quot;we&apos;ll call you back.&quot;</p>
              </div>
            </div>
            <div className="nz-bento-card">
              <div className="nz-bento-stat display"><span className="red">5s</span></div>
              <div><p>Average time from search to a confirmed booking.</p></div>
            </div>
            <div className="nz-bento-card wide">
              <div className="nz-bento-icon"><Icon name="card" size={22} /></div>
              <div>
                <h3 className="display">Pay your way — the Algerian way</h3>
                <p>CIB, Eddahabia, bank transfer, WhatsApp-assisted booking, or cash at the hotel. Every method Algerians actually use.</p>
              </div>
            </div>
            <div className="nz-bento-card">
              <div className="nz-bento-icon"><Icon name="whatsapp" size={22} /></div>
              <div>
                <h3 className="display">Real human support</h3>
                <p>An Algerian team on WhatsApp +213, whenever you need them.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ALLOUNI STRIP */}
      <div className="nz-allouni" id="allouni">
        <div className="wrap nz-allouni-inner">
          <div className="nz-allouni-left">
            <div className="nz-allouni-seal"><Icon name="shield" size={32} style={{ color: "#fff" }} /></div>
            <div>
              <h4 className="display">Operated by Allouni Travel Agency</h4>
              <p>A licensed travel agency authorized by the Algerian Ministry of Tourism — your booking is protected by a real, accountable institution.</p>
            </div>
          </div>
          <div className="nz-allouni-badges">
            {["Ministry licensed", "SATIM secured", "Verified hotels"].map((b) => (
              <div className="nz-allouni-badge" key={b}>
                <Icon name="check" size={16} strokeWidth={2.5} style={{ color: "var(--teal)" }} />
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppButton />
    </>
  );
}
