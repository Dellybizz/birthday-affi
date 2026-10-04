# C3 save fix and editable layouts

The production database validator incorrectly reused the last node property key while validating the page theme. The migration restores use of the theme property key. Regression coverage saves a full valid theme and rejects invalid colors. The correction is applied to the dedicated database.

The template picker now includes all six app layouts plus the final reveal, greeting, photo story and home. Templates append independent editable sections and never replace existing work. Personal content and media still need to be supplied. Interactive canvas mode allows trying app behavior without selecting layers.

Performance: request-scoped React cache deduplicates public content/config/navigation reads, canvas validation is memoized across selection changes, and a route loading view gives immediate feedback. No stale persistent cache is introduced, so published content remains fresh. Public OS has a maximum 430px phone width and safe-area spacing. No measured live performance claim yet.

This is a C3 increment. Full shell parity and the expanded advanced inspector remain outstanding; later app interaction phases are not complete.
