// Demo data (blog, prices, hours, reviews from the original site) loaded the
// first time the site runs without Supabase. Every read awaits this promise,
// so the very first page view already shows the content.
let seeding = null;

export function seedIfEmpty() {
  if (seeding) return seeding;
  seeding = (async () => {
    try {
      if (localStorage.getItem('massolab:seeded') === '1') return;
      const { default: data } = await import('./demoSeedData.js');
      for (const [entity, rows] of Object.entries(data || {})) {
        const key = `massolab:${entity}`;
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(rows));
      }
      localStorage.setItem('massolab:seeded', '1');
    } catch {
      /* storage blocked or chunk failed: the site still works, just empty */
    }
  })();
  return seeding;
}
