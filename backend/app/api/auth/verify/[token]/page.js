// app/api/auth/verify/[token]/page.js
import React from "react";
import User from "@/Database/auth";
import { redisGet, redisSet, redisDel } from "@/app/utils/redis";
import { verifyVerificationToken } from "@/app/utils/token";
import { connectToDb } from "@/app/utils/mongo";

/* ---------- small UI pieces (inline styles only) ---------- */

function Container({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f6f8fa",
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 760,
        borderRadius: 12,
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(16,24,40,0.08)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function Header({ appName }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "20px 28px", borderBottom: "1px solid #eef2f7" }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: "#10b981",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: 18,
          boxShadow: "inset 0 -4px 8px rgba(0,0,0,0.06)",
        }}
        aria-hidden
      >
        BE
      </div>
      <div style={{ marginLeft: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{appName}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Community blogging, simplified</div>
      </div>
    </div>
  );
}

function Body({ children }) {
  return <div style={{ padding: "28px 32px" }}>{children}</div>;
}

function Footer({ appName }) {
  return (
    <div style={{ padding: "18px 32px", background: "#fbfdff", borderTop: "1px solid #eef2f7", fontSize: 12, color: "#94a3b8" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 600, color: "#0f172a" }}>{appName}</div>
        <div style={{ marginLeft: "auto" }}>&copy; {new Date().getFullYear()}</div>
      </div>
    </div>
  );
}

function IconSuccess() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#10b981" />
      <path d="M7 12.5l2.5 2.5L17 8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconError() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#ef4444" />
      <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActionButton({ href, children, color = "#2563eb" }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-block",
        padding: "12px 20px",
        background: color,
        color: "#fff",
        textDecoration: "none",
        borderRadius: 10,
        fontWeight: 700,
        fontSize: 15,
        boxShadow: "0 6px 18px rgba(37,99,235,0.12)",
      }}
    >
      {children}
    </a>
  );
}

/* ---------- main server component (SSR) ---------- */

export default async function VerifyPage({ params }) {
  const token = params?.token;
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || process.env.APP_NAME || "BlogEver";
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || "").replace(/\/$/, "") || "";
  const loginUrl = baseUrl ? `${baseUrl}/login` : "/login";
  const homeUrl = baseUrl || "/";

  // quick invalid token page
  if (!token || typeof token !== "string") {
    return (
      <Container>
        <Card>
          <Header appName={APP_NAME} />
          <Body>
            <div style={{ display: "flex", gap: 18 }}>
              <div>
                <IconError />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: 20 }}>Invalid request</h2>
                <p style={{ margin: 0, color: "#475569" }}>No verification token was provided in the URL.</p>
                <div style={{ marginTop: 18 }}>
                  <ActionButton href={homeUrl} color="#2563eb">Go to homepage</ActionButton>
                </div>
              </div>
            </div>
          </Body>
          <Footer appName={APP_NAME} />
        </Card>
      </Container>
    );
  }

  try {
    // verify JWT & get user id
    const payload = verifyVerificationToken(token);
    if (!payload?.sub) {
      return (
        <Container>
          <Card>
            <Header appName={APP_NAME} />
            <Body>
              <div style={{ display: "flex", gap: 18 }}>
                <div>
                  <IconError />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 8px 0", color: "#b91c1c", fontSize: 20 }}>Invalid or expired link</h2>
                  <p style={{ margin: 0, color: "#475569" }}>
                    This verification link looks invalid or has expired. Request a new verification email from the app.
                  </p>
                  <div style={{ marginTop: 18 }}>
                    <ActionButton href={homeUrl} color="#2563eb">Request new verification</ActionButton>
                  </div>
                </div>
              </div>
            </Body>
            <Footer appName={APP_NAME} />
          </Card>
        </Container>
      );
    }

    const userId = String(payload.sub);
    const redisKey = `verify:${userId}`;

    // connect DB
    await connectToDb();

    // try fast path (redis)
    const tokenInRedis = await redisGet(redisKey);

    if (tokenInRedis) {
      if (tokenInRedis !== token) {
        return (
          <Container>
            <Card>
              <Header appName={APP_NAME} />
              <Body>
                <div style={{ display: "flex", gap: 18 }}>
                  <div><IconError /></div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: "0 0 8px 0", color: "#b91c1c", fontSize: 20 }}>Token mismatch</h2>
                    <p style={{ margin: 0, color: "#475569" }}>The verification token does not match our records.</p>
                  </div>
                </div>
              </Body>
              <Footer appName={APP_NAME} />
            </Card>
          </Container>
        );
      }

      // fetch user
      const user = await User.findById(userId).lean();
      if (!user) {
        return (
          <Container>
            <Card>
              <Header appName={APP_NAME} />
              <Body>
                <div style={{ display: "flex", gap: 18 }}>
                  <div><IconError /></div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: "0 0 8px 0", color: "#b91c1c", fontSize: 20 }}>User not found</h2>
                    <p style={{ margin: 0, color: "#475569" }}>No user associated with this verification link.</p>
                  </div>
                </div>
              </Body>
              <Footer appName={APP_NAME} />
            </Card>
          </Container>
        );
      }

      if (user.isVerified) {
        return (
          <Container>
            <Card>
              <Header appName={APP_NAME} />
              <Body>
                <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                  <div><IconSuccess /></div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: "0 0 8px 0", color: "#059669", fontSize: 20 }}>Already verified</h2>
                    <p style={{ margin: 0, color: "#475569" }}>Your account is already verified. You can sign in.</p>
                    <div style={{ marginTop: 14 }}>
                      <ActionButton href={loginUrl} color="#2563eb">Go to sign in</ActionButton>
                    </div>
                  </div>
                </div>
              </Body>
              <Footer appName={APP_NAME} />
            </Card>
          </Container>
        );
      }

      // mark verified
      await User.findByIdAndUpdate(userId, {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      });

      // best-effort cleanup
      try {
        await redisDel(redisKey);
      } catch (e) {
        console.warn("Redis delete failed:", e);
      }

      return (
        <Container>
          <Card>
            <Header appName={APP_NAME} />
            <Body>
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <div><IconSuccess /></div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 8px 0", color: "#059669", fontSize: 20 }}>Account verified</h2>
                  <p style={{ margin: 0, color: "#475569" }}>
                    Thanks — your email has been verified. Welcome to {APP_NAME}.
                  </p>
                  <div style={{ marginTop: 14 }}>
                    <ActionButton href={loginUrl} color="#2563eb">Sign in</ActionButton>
                  </div>
                </div>
              </div>
            </Body>
            <Footer appName={APP_NAME} />
          </Card>
        </Container>
      );
    }

    // redis miss → fallback DB
    const user = await User.findById(userId).lean();
    if (!user || !user.verificationToken) {
      return (
        <Container>
          <Card>
            <Header appName={APP_NAME} />
            <Body>
              <div style={{ display: "flex", gap: 18 }}>
                <div><IconError /></div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 8px 0", color: "#b91c1c", fontSize: 20 }}>Token not found</h2>
                  <p style={{ margin: 0, color: "#475569" }}>The verification link is invalid or has expired.</p>
                </div>
              </div>
            </Body>
            <Footer appName={APP_NAME} />
          </Card>
        </Container>
      );
    }

    if (user.isVerified) {
      return (
        <Container>
          <Card>
            <Header appName={APP_NAME} />
            <Body>
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <div><IconSuccess /></div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 8px 0", color: "#059669", fontSize: 20 }}>Already verified</h2>
                  <p style={{ margin: 0, color: "#475569" }}>Your account is already verified. You can sign in.</p>
                  <div style={{ marginTop: 14 }}>
                    <ActionButton href={loginUrl} color="#2563eb">Go to sign in</ActionButton>
                  </div>
                </div>
              </div>
            </Body>
            <Footer appName={APP_NAME} />
          </Card>
        </Container>
      );
    }

    if (user.verificationToken !== token) {
      return (
        <Container>
          <Card>
            <Header appName={APP_NAME} />
            <Body>
              <div style={{ display: "flex", gap: 18 }}>
                <div><IconError /></div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 8px 0", color: "#b91c1c", fontSize: 20 }}>Token mismatch</h2>
                  <p style={{ margin: 0, color: "#475569" }}>The verification token does not match our records.</p>
                </div>
              </div>
            </Body>
            <Footer appName={APP_NAME} />
          </Card>
        </Container>
      );
    }

    if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
      return (
        <Container>
          <Card>
            <Header appName={APP_NAME} />
            <Body>
              <div style={{ display: "flex", gap: 18 }}>
                <div><IconError /></div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 8px 0", color: "#b91c1c", fontSize: 20 }}>Token expired</h2>
                  <p style={{ margin: 0, color: "#475569" }}>The verification link has expired. Request a new verification email.</p>
                </div>
              </div>
            </Body>
            <Footer appName={APP_NAME} />
          </Card>
        </Container>
      );
    }

    // all good — finalize verification
    await User.findByIdAndUpdate(userId, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    });

    // warm redis and then clean up
    try {
      await redisSet(redisKey, token, 24 * 60 * 60);
    } catch (e) {
      console.warn("Redis warm failed:", e);
    }
    try {
      await redisDel(redisKey);
    } catch (e) {
      console.warn("Redis delete failed:", e);
    }

    return (
      <Container>
        <Card>
          <Header appName={APP_NAME} />
          <Body>
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <div><IconSuccess /></div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: "0 0 8px 0", color: "#059669", fontSize: 20 }}>Account verified</h2>
                <p style={{ margin: 0, color: "#475569" }}>Thanks — your email has been verified. Welcome to {APP_NAME}.</p>
                <div style={{ marginTop: 14 }}>
                  <ActionButton href={loginUrl} color="#2563eb">Sign in</ActionButton>
                </div>
              </div>
            </div>
          </Body>
          <Footer appName={APP_NAME} />
        </Card>
      </Container>
    );
  } catch (err) {
    console.error("Verification page error:", err);
    return (
      <Container>
        <Card>
          <Header appName={APP_NAME} />
          <Body>
            <div style={{ display: "flex", gap: 18 }}>
              <div><IconError /></div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: "0 0 8px 0", color: "#b91c1c", fontSize: 20 }}>Server error</h2>
                <p style={{ margin: 0, color: "#475569" }}>Something went wrong while verifying your account. Try again later.</p>
                <div style={{ marginTop: 18 }}>
                  <ActionButton href={homeUrl} color="#2563eb">Go to homepage</ActionButton>
                </div>
              </div>
            </div>
          </Body>
          <Footer appName={APP_NAME} />
        </Card>
      </Container>
    );
  }
}
