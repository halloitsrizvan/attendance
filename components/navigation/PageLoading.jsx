import styles from './Navigation.module.css';

export default function PageLoading() {
  return <section className={styles.skeleton} role="status" aria-label="Loading page" aria-busy="true">
    <div className={styles.skeletonLabel}><span className={styles.spinner} aria-hidden="true" />Loading page...</div>
    <div aria-hidden="true"><div className={styles.banner} /><div className={styles.filters} /><div className={styles.cards}>{Array.from({ length: 6 }, (_, i) => <div key={i} />)}</div></div>
  </section>;
}
