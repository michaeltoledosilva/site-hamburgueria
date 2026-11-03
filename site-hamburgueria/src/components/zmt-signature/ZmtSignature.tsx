import type { CSSProperties } from 'react';
import content from './content.json';
import styles from './signature.module.css';

type Props = {
  siteName: string;
  palette: { background: string; text: string; accent: string; buttonText: string; muted: string };
};

/** ZMT signature: generated from the approved central skill. */
export default function ZmtSignature({ siteName, palette }: Props) {
  const message = `Olá! Gostei da experiência do site ${siteName} e quero conversar sobre um site para minha empresa.`;
  const whatsapp = `https://wa.me/${content.whatsappNumber}?text=${encodeURIComponent(message)}`;
  const theme = {
    '--zmt-background': palette.background,
    '--zmt-text': palette.text,
    '--zmt-accent': palette.accent,
    '--zmt-button-text': palette.buttonText,
    '--zmt-muted': palette.muted,
  } as CSSProperties;

  return (
    <aside className={styles.signature} style={theme} aria-label="Criação de sites pela ZMT" data-zmt-signature={content.version}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 className={styles.title}>{content.text}</h2>
          <p className={styles.description}>{content.description}</p>
        </div>
        <div className={styles.actions}>
          <a className={styles.button} href={whatsapp} target="_blank" rel="noopener noreferrer" aria-describedby="zmt-whatsapp-hint">
            {content.primaryLabel}<span className={styles.arrow} aria-hidden="true">↗</span>
          </a>
          <span className={styles.hint} id="zmt-whatsapp-hint">{content.contactHint}</span>
          <a className={styles.website} href={content.url} target="_blank" rel="noopener noreferrer">{content.websiteLabel}</a>
        </div>
      </div>
    </aside>
  );
}
