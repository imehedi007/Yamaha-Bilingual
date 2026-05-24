'use client';

import { useLanguage } from '@/components/i18n/LanguageProvider';
import styles from '../result.module.css';
import ResultActions from './ResultActions';

interface ResultViewProps {
  generatedImageUrl: string;
  name: string;
  modelName: string;
  traitsSummary: string;
}

export default function ResultView({
  generatedImageUrl,
  name,
  modelName,
  traitsSummary,
}: ResultViewProps) {
  const { language, t } = useLanguage();
  const personaTitle = language === 'bn' ? `${name}${t.result.personaTitleSuffix}` : `${name}${t.result.personaTitleSuffix}`;

  return (
    <main className="page-container">
      <div className={`${styles.container} fade-in`}>
        <div className={styles.card} id="persona-card">
          <div className={styles.imageWrapper}>
            <img src={generatedImageUrl} alt="AI Persona" className={styles.genImage} />
          </div>
          <div className={styles.content}>
            <div className={styles.badge}>{modelName} {t.result.riderBadgeSuffix}</div>
            <h2 className={styles.personaTitle}>{personaTitle}</h2>
            <p className={styles.copy}>{traitsSummary}</p>
          </div>
        </div>

        <ResultActions imageUrl={generatedImageUrl} userName={name} />
      </div>
    </main>
  );
}
