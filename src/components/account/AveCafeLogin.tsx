"use client";

import {
  CircleAlert,
  Eye,
  EyeOff,
  LampDesk,
  LockKeyhole,
  Mail,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BUSINESS_CONFIG } from "@/config/business";
import { useAuth } from "@/contexts/AuthContext";
import { resolveAccountRedirect } from "@/lib/utils/account-redirect";
import { extractBasePath } from "@/lib/utils/path";
import styles from "./AveCafeLogin.module.css";

export function AveCafeLogin() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = extractBasePath(pathname);
  const t = useTranslations("account");
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lampOn, setLampOn] = useState(false);
  const redirectUrl = resolveAccountRedirect(
    searchParams.get("redirect"),
    basePath,
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (redirectUrl) router.push(redirectUrl);
      } else {
        setError(result.error || t("invalidCredentials"));
      }
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div
        className={`${styles.glow} ${lampOn ? styles.glowActive : ""}`}
        aria-hidden="true"
      />
      <div className={`${styles.layout} ${lampOn ? styles.lit : ""}`}>
        <section className={styles.welcome}>
          <Link
            href={basePath || "/"}
            className={styles.brand}
            aria-label={BUSINESS_CONFIG.brand.name}
          >
            <Image
              src={BUSINESS_CONFIG.brand.logo}
              alt=""
              width={58}
              height={58}
              priority
            />
            <span>{BUSINESS_CONFIG.brand.name}</span>
          </Link>
          <p className={styles.eyebrow}>CAFÉ COLOMBIANO DE ORIGEN</p>
          <h1>
            Una pausa
            <br />
            con buen origen.
          </h1>
          <p className={styles.intro}>
            Ingresa a tu cuenta y vuelve a disfrutar tus cafés favoritos.
          </p>
          <div
            className={styles.lampScene}
            role="img"
            aria-label={lampOn ? "Lámpara encendida" : "Lámpara apagada"}
          >
            <div className={styles.lightBeam} />
            <div className={styles.lampShade}>
              <span />
            </div>
            <div className={styles.lampArm} />
            <div className={styles.lampJoint} />
            <div className={styles.lampFoot} />
            <button
              className={styles.pull}
              onClick={() => setLampOn((value) => !value)}
              aria-label={lampOn ? "Apagar lámpara" : "Encender lámpara"}
            >
              <span />
            </button>
            <p>
              {lampOn
                ? "La luz está encendida"
                : "Tira del cordón para encender"}
            </p>
          </div>
          <p className={styles.tagline}>{BUSINESS_CONFIG.brand.tagline}</p>
        </section>

        <section className={styles.panel} aria-labelledby="login-title">
          <div className={styles.panelHead}>
            <span className={styles.icon}>
              <LampDesk size={21} strokeWidth={1.7} />
            </span>
            <span className={styles.panelEyebrow}>
              QUÉ BUENO TENERTE DE VUELTA
            </span>
            <h2 id="login-title">Inicia sesión</h2>
            <p>Entra para continuar con tu experiencia AveCafé.</p>
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.error} role="alert">
                <CircleAlert size={18} />
                {error}
              </div>
            )}
            <label className={styles.field} htmlFor="email">
              <span>Correo electrónico</span>
              <span className={styles.inputWrap}>
                <Mail size={18} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@correo.com"
                />
              </span>
            </label>
            <label className={styles.field} htmlFor="password">
              <span>Contraseña</span>
              <span className={styles.inputWrap}>
                <LockKeyhole size={18} />
                <input
                  id="password"
                  name="current-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Tu contraseña"
                />
                <button
                  className={styles.reveal}
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? t("hidePassword") : t("showPassword")
                  }
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <div className={styles.forgot}>
              <Link href={`${basePath}/account/forgot-password`}>
                {t("forgotPassword")}
              </Link>
            </div>
            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? "Validando acceso…" : "Entrar a mi cuenta"}
              <span aria-hidden="true">→</span>
            </button>
          </form>
          <div className={styles.divider}>
            <span>TU CUENTA AVECAFÉ</span>
          </div>
          <p className={styles.register}>
            ¿Aún no tienes cuenta?{" "}
            <Link href={`${basePath}/account/register`}>Regístrate aquí</Link>
          </p>
          <p className={styles.secure}>Acceso seguro a tu cuenta AveCafé</p>
        </section>
      </div>
    </main>
  );
}
