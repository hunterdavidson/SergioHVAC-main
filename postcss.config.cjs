// PostCSS config with PurgeCSS to strip unused CSS from global styles.
// Purges classes based on your Angular templates and TS files.
// Note: requires devDependency @fullhuman/postcss-purgecss installed.

let purgecss = null;
try { purgecss = require('@fullhuman/postcss-purgecss'); } catch {}

const enablePurge = process.env.NODE_ENV === 'production';

module.exports = {
  plugins: [
    ...((enablePurge && purgecss)
      ? [
          purgecss({
            content: [
              './src/**/*.html',
              './src/**/*.ts',
              './public/**/*.html'
            ],
            defaultExtractor: content => content.match(/[A-Za-z0-9-_:/.]+/g) || [],
            safelist: {
              standard: [
                // Bootstrap and site utility patterns/classes used dynamically
                /^container$/, /^row$/, /^col-/, /^g-/, /^mb-/, /^mt-/, /^ms-/, /^me-/, /^py-/, /^px-/,
                /^d-/, /^flex/, /^align-/, /^justify-/, /^text-/, /^bg-/, /^btn/, /^navbar/, /^nav-/,
                /^collapse/, /^show$/, /^spinner-border$/, /^form-/, /^visually-hidden$/, /^rounded/,
                /^shadow/, /^card/, /^badge$/, /^border/, /^small$/,
                // Site-specific helpers
                'hero-bg', 'overlay', 'hero-inner', 'service-box', 'service-icon', 'nav-call-btn',
                'masthead', 'masthead-heading', 'masthead-subheading', 'dynamic-button', 'dynamic-button-danger'
              ]
            }
          })
        ]
      : []),
  ]
};
