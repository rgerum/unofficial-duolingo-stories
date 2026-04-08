import type { Metadata } from "next";
import Button from "@/components/ui/button";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Story Footer Button Test",
  robots: {
    index: false,
    follow: false,
  },
};

const buttonStates = [
  {
    className: "",
    description: "Base state in the finished footer.",
    label: "Default",
  },
  {
    className: styles.previewHover,
    description: "Pointer hover styling.",
    label: "Hover",
  },
  {
    className: styles.previewActive,
    description: "Pressed state with reduced depth.",
    label: "Active",
  },
  {
    className: styles.previewFocus,
    description: "Keyboard focus-visible ring.",
    label: "Focus",
  },
] as const;

const variants = [
  {
    description: "Primary green CTA used for default story progression.",
    label: "default",
    variant: "default",
  },
  {
    description: "Blue CTA variant used in auth and key story entry points.",
    label: "primary",
    variant: "primary",
  },
  {
    description:
      "Neutral raised secondary action, now used for Back to overview.",
    label: "secondary",
    variant: "secondary",
  },
  {
    description: "Neutral outline action for cases like OAuth providers.",
    label: "outline",
    variant: "outline",
  },
  {
    description: "Low-emphasis background treatment for lightweight actions.",
    label: "ghost",
    variant: "ghost",
  },
  {
    description: "Inline text-style action for low-friction navigation.",
    label: "link",
    variant: "link",
  },
] as const;

const themes = [
  {
    className: styles.themeLight,
    label: "Light mode",
  },
  {
    className: styles.themeDark,
    label: "Dark mode",
  },
] as const;

const footerWaitVariants = [
  {
    description: "The disabled wait-state footer action.",
    disabled: true,
    label: "wait",
    variant: "default",
  },
  {
    description: "The normal enabled continue action.",
    disabled: false,
    label: "continue",
    variant: "default",
  },
  {
    description: "The blue-toned primary variant in footer framing.",
    disabled: false,
    label: "primary",
    variant: "primary",
  },
] as const;

export default function Page() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>UI test page</p>
          <h1>Shared button variants and footer states</h1>
          <p className={styles.copy}>
            This page compares the shared action variants and isolates the
            finished-story secondary state so contrast and interaction behavior
            can be checked quickly in both themes.
          </p>
        </header>

        <div className={styles.themeGrid}>
          {themes.map((theme) => (
            <section
              key={theme.label}
              className={`${styles.themePanel} ${theme.className}`}
            >
              <div className={styles.themeHeader}>
                <div>
                  <p className={styles.themeEyebrow}>Preview</p>
                  <h2>{theme.label}</h2>
                </div>
                <span className={styles.themeBadge}>Back to overview</span>
              </div>

              <div className={styles.variantGrid}>
                {variants.map((variant) => (
                  <article key={variant.label} className={styles.stateCard}>
                    <div className={styles.stateLabelRow}>
                      <h3>{variant.label}</h3>
                      <span>{variant.description}</span>
                    </div>
                    <div className={styles.buttonStage}>
                      <Button variant={variant.variant}>Example action</Button>
                    </div>
                  </article>
                ))}
              </div>

              <div className={styles.subsectionHeader}>
                <h3>Disabled variants</h3>
                <span>Disabled snapshots for every shared button variant.</span>
              </div>

              <div className={styles.variantGrid}>
                {variants.map((variant) => (
                  <article
                    key={`${theme.label}-${variant.label}-disabled`}
                    className={styles.stateCard}
                  >
                    <div className={styles.stateLabelRow}>
                      <h3>{variant.label}</h3>
                      <span>{variant.description}</span>
                    </div>
                    <div className={styles.buttonStage}>
                      <Button disabled variant={variant.variant}>
                        Example action
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              <div className={styles.subsectionHeader}>
                <h3>Secondary state breakdown</h3>
                <span>
                  Static snapshots of the footer action state treatment.
                </span>
              </div>

              <div className={styles.stateGrid}>
                {buttonStates.map((state) => (
                  <article key={state.label} className={styles.stateCard}>
                    <div className={styles.stateLabelRow}>
                      <h3>{state.label}</h3>
                      <span>{state.description}</span>
                    </div>
                    <div className={styles.buttonStage}>
                      <Button
                        variant="secondary"
                        className={state.className}
                        type="button"
                      >
                        Back to overview
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              <div className={styles.liveCard}>
                <div className={styles.stateLabelRow}>
                  <h3>Interactive</h3>
                  <span>
                    Live control for manual hover, click, and focus tests.
                  </span>
                </div>
                <div className={styles.buttonStage}>
                  <Button variant="secondary" type="button">
                    Back to overview
                  </Button>
                </div>
              </div>

              <div className={styles.subsectionHeader}>
                <h3>Footer button state</h3>
                <span>
                  Continue-button snapshots inside footer-style framing.
                </span>
              </div>

              <div className={styles.footerGrid}>
                {footerWaitVariants.map((footerVariant) => (
                  <article
                    key={`${theme.label}-${footerVariant.label}-footer`}
                    className={styles.footerCard}
                  >
                    <div className={styles.stateLabelRow}>
                      <h3>{footerVariant.label}</h3>
                      <span>{footerVariant.description}</span>
                    </div>
                    <div className={styles.footerStage}>
                      <div className={styles.footerFrame}>
                        <Button
                          disabled={footerVariant.disabled}
                          variant={footerVariant.variant}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
