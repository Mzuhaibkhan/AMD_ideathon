"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const HERO_CARDS = [
  { id: "hc-1", label: "Track", num: "01", accent: "var(--accent-1)" },
  { id: "hc-2", label: "Analyze", num: "02", accent: "var(--accent-2)" },
  { id: "hc-3", label: "Optimize", num: "03", accent: "var(--accent-3)" },
];

const TAGS = ["▶ AI Nutrition", "▶ Smart Budget"];

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Scramble effect
  const scrambleRef = useRef<HTMLSpanElement[]>([]);
  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%";
    scrambleRef.current.forEach((el, i) => {
      const original = el.textContent || "";
      let iter = 0;
      const id = setInterval(() => {
        el.textContent = original.split("").map((c, j) => {
          if (j < iter) return original[j];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join("");
        if (iter >= original.length) clearInterval(id);
        iter += 0.4;
      }, 30 + i * 15);
    });
  }, []);

  // Card entrance + scroll fan-out
  useEffect(() => {
    const cards = cardsRef.current;
    gsap.set(cards, { scale: 0, transformOrigin: "center center" });
    gsap.to(cards, { scale: 1, duration: 0.75, delay: 0.5, stagger: 0.1, ease: "power4.out" });

    const smoothStep = (p: number) => p * p * (3 - 2 * p);

    if (window.innerWidth > 1000) {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "75% top",
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress;
          gsap.set(".hero-cards-container", { opacity: gsap.utils.interpolate(1, 0.4, smoothStep(p)) });
          cards.forEach((card, idx) => {
            const delay = idx * 0.9;
            const cp = gsap.utils.clamp(0, 1, (p - delay * 0.1) / (1 - delay * 0.1));
            const y = gsap.utils.interpolate("0%", "400%", smoothStep(cp));
            const scale = gsap.utils.interpolate(1, 0.75, smoothStep(cp));
            let x = "0%", rotation = 0;
            if (idx === 0) { x = gsap.utils.interpolate("0%", "80%", smoothStep(cp)); rotation = gsap.utils.interpolate(0, -15, smoothStep(cp)); }
            if (idx === 2) { x = gsap.utils.interpolate("0%", "-80%", smoothStep(cp)); rotation = gsap.utils.interpolate(0, 15, smoothStep(cp)); }
            gsap.set(card, { y, x, rotation, scale });
          });
        },
      });
    }

    // Title reveal
    if (titleRef.current) {
      gsap.fromTo(titleRef.current, { y: "100%", opacity: 0 }, { y: "0%", opacity: 1, duration: 1, delay: 0.2, ease: "power4.out" });
    }

    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  return (
    <section ref={sectionRef} style={{ position: "relative", width: "100vw", height: "100svh", overflow: "hidden", backgroundColor: "var(--base-100)" }}>
      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", padding: "1.5rem 2.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
        <div className="symbols-container">
          <div className="symbol sym-1" /><div className="symbol sym-2" /><div className="symbol sym-3" />
        </div>
        <div className="symbols-container">
          <div className="symbol sym-3" /><div className="symbol sym-2" /><div className="symbol sym-1" />
        </div>
      </div>

      {/* Main content */}
      <div className="container" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "14svh" }}>
        {/* Title */}
        <div style={{ textAlign: "center", overflow: "hidden" }}>
          <h1 ref={titleRef} style={{ fontSize: "clamp(4rem, 14vw, 14rem)", color: "var(--base-300)", willChange: "transform" }}>
            NutriTrack AI
          </h1>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: "0.5rem", zIndex: 2 }}>
          <div style={{ width: "38%" }}>
            <p className="md" style={{ lineHeight: 1.5 }}>
              Track every bite, every rupee, every macro — powered by Gemini AI and machine learning that actually understands your body.
            </p>
          </div>
          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            {TAGS.map((t, i) => (
              <p key={i} className="mono">
                <span ref={el => { if (el) scrambleRef.current[i] = el; }}>{t}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <div className="hero-cards-container" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "32%", display: "flex", justifyContent: "center", gap: "1rem" }}>
        {HERO_CARDS.map((c, i) => (
          <div key={c.id} ref={el => { if (el) cardsRef.current[i] = el; }} style={{ flex: 1, position: "relative", aspectRatio: "5/7" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: "100%", height: "100%", padding: "1rem", borderRadius: 10, backgroundColor: c.accent, animation: `floatingAlt 2s ${i * 0.25}s infinite ease-in-out`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p className="mono" style={{ fontSize: "0.72rem" }}>{c.label}</p>
                <p className="mono" style={{ fontSize: "0.72rem" }}>{c.num}</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p className="mono" style={{ fontSize: "0.72rem" }}>{c.num}</p>
                <p className="mono" style={{ fontSize: "0.72rem" }}>{c.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll cue */}
      <div style={{ position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", animation: "floatingAlt 2s infinite ease-in-out" }}>
        <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Scroll</p>
        <div style={{ width: 1, height: 40, backgroundColor: "var(--base-secondary-dark)" }} />
      </div>
    </section>
  );
}
