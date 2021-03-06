/* global require */
const gulp = require('gulp');

const pkg = require('./package.json');
const cfg = require('./gulp.config.json');

// additional native gulp packages
const del = require('del');
const fs = require('fs');
const path = require('path');
const merge = require('merge-stream');

// load all plugins from package development dependencies
const $ = require('gulp-load-plugins')({
    'scope': ['devDependencies'],
    'pattern': ['*'],
    'rename': {
        'gulp-angular-embed-templates': 'embedTemplates',
        'gulp-if': 'gulpIf',
        'rollup-stream': 'rollup',
        'vinyl-buffer': 'buffer',
        'vinyl-source-stream': 'source',
    },
    'postRequireTransforms': {
        'uglify': uglify => require('gulp-uglify/composer')(require('uglify-es'), console)
    }
});



// TODO: the minify process should attempt to concatenate all of the linked components for the pages (ala useref?)
// TODO: all functions should be named to avoid <anonymous> in output - the build functions (after linting) are the problematic ones


/* ==================== HELPER FUNCTIONS ==================== */

/**
 * Get the names of all immediate folders within the supplied directory
 * @param {string} dir  the path to the directory
 * @returns {string[]} the names of immediate folders within the directory
 */
function folders(dir) {
    return fs.readdirSync(dir).filter(file => fs.statSync(path.join(dir, file)).isDirectory());
}

/**
 * Lints all JavaScript files within the supplied directory
 * @param {string} dir the path to the directory
 * @param {Boolean} [fix=true] indicates if eslint should attempt to fix errors
 * @param {Boolean} [failOnError=true] indicates if eslint should fail if there are any unfixed errors
 */
function lint(dir, fix = true, failOnError = true) {
    return $.pump([
        gulp.src(`${dir}/**/*.js`),
        $.eslint({
            'fix': fix
        }),
        $.eslint.format(),
        $.gulpIf(failOnError, $.eslint.failOnError()),
    ]);
}



/* ====================  BUILD TASKS  ==================== */

gulp.task('clean', () => {
    return del(['./dist/*'])
        .catch((error) => {
            console.error(error);
        });
});

gulp.task('minify', () => {
    return $.pump([
        gulp.src(['./dist/**/*.{css,js}', '!./dist/*/vendor/**/*', '!./dist/**/*.min.*', ]),
        $.gulpIf(['**/*.css'], $.postcss()),    // options are loaded from postcss.config.js automatically
        $.gulpIf(['**/*.js'], $.uglify(cfg.plugin_options.uglify)),
        // TODO: the filenames SHOULD include .min, but we would need to update the paths in both the HTML files and the manifests
        //$.rename({ 'suffix': '.min' }),
        $.header(fs.readFileSync('./src/banner.txt', 'utf8'), {
            'pkg': pkg
        }),
        gulp.dest('./dist'),
    ]);
});

// ==========================================
// build & lint tasks, broken into components
// ==========================================

gulp.task('lint:components', () => {
    return lint(cfg.source_folders.components, true, false);
});
gulp.task('build:components', gulp.series('lint:components', () => {
    return merge(folders(cfg.source_folders.components).map((folder) => {
        return $.pump([
            gulp.src([`${cfg.source_folders.components}/${folder}/**/*.js`]),
            $.embedTemplates(),
            $.concat(folder + '.js'),
            ...Object.keys(cfg.supported_browsers).map(browser => gulp.dest(`./dist/${browser}/components`)),
        ]);
    }));
}));


gulp.task('lint:helpers', () => {
    return lint(cfg.source_folders.helpers, true, false);
});


gulp.task('build:images', () => {
    return $.pump([
        gulp.src(['./images/**/*.{png,svg}']),
        ...Object.keys(cfg.supported_browsers).map(browser => gulp.dest(`./dist/${browser}/images`)),
    ]);
});


/**
 * Creates multiple resized PNG versions of the SVG logo files
 */
gulp.task('build:logos', () => {
    //TODO: handle the icons/sizes defined in page_action.default_icon for Edge
    const manifest = JSON.parse(fs.readFileSync(`${cfg.source_folders.manifests}/manifest.shared.json`));
    const icons = manifest.icons;
    return merge(Object.keys(icons).map((size) => {
        const file = path.basename(icons[size], '.png').replace(/\-\d+/, '');
        return $.pump([
            gulp.src([`./images/logo/${file}.svg`]),
            $.svg2png({
                'width': size,
                'height': size
            }),
            $.rename(icons[size]),  // the name includes the relative path structure (from the manifest to the icon)
            ...Object.keys(cfg.supported_browsers).map(browser => gulp.dest(`./dist/${browser}`)),
        ]);
    }));
});


gulp.task('build:less', () => {
    return merge(Object.keys(cfg.supported_browsers).map((browser) => {
        return $.pump([
            gulp.src([`${cfg.source_folders.less}/*.less`]),
            $.less(cfg.plugin_options.less),
            $.replace(/browser-extension\:\/\//gm, cfg.supported_browsers[browser].protocol),
            gulp.dest(`./dist/${browser}/css`),
        ]);
    }));
});


gulp.task('build:locales', () => {
    return merge(folders(cfg.source_folders.locales).map((folder) => {
        return $.pump([
            gulp.src([`${cfg.source_folders.locales}/${folder}/**/*.json`]),
            $.mergeJson({ 'fileName': 'messages.json' }),
            ...Object.keys(cfg.supported_browsers).map(browser => gulp.dest(`./dist/${browser}/_locales/${folder}`)),
        ]);
    }));
});


gulp.task('build:manifest', () => {
    return merge(Object.keys(cfg.supported_browsers).map((browser) => {
        return $.pump([
            gulp.src([
                `${cfg.source_folders.manifests}/manifest.shared.json`,
                `${cfg.source_folders.manifests}/manifest.${browser}.json`,
            ]),
            $.mergeJson({ 'fileName': 'manifest.json' }),
            $.ejs({ 'pkg': pkg }),
            gulp.dest(`./dist/${browser}`),
        ]);
    }));
});


gulp.task('lint:pages', () => {
    return lint(cfg.source_folders.pages, true, false);
});
gulp.task('build:pages', gulp.series('lint:pages', () => {
    return merge(folders(cfg.source_folders.pages).map((folder) => {
        return $.pump([
            // TODO: invoking useref prevents this entire task from properly ending, so any dependent tasks do not complete properly (like the 'watch' task, which just stops completely...)
            //gulp.src([`${_folders.pages}/${folder}/**/*.html`]),
            //$.useref(),

            // TODO: if/whe useref works, this line must be removed (useref passes the HTML files and all assets through the stream)
            gulp.src([`${cfg.source_folders.pages}/${folder}/**/*.*`]),

            // TODO: maybe use gulp-html-replace to only inject the browser polyfill for Chrome (or remove it for Firefox)? then the manifest for Firefox can probably omit the polyfill script completely
            ...Object.keys(cfg.supported_browsers).map(browser => gulp.dest(`./dist/${browser}/pages/${folder}`)),
        ]);
    }));
}));


gulp.task('lint:scripts', gulp.series('lint:helpers', () => {
    return lint(cfg.source_folders.scripts, true, false);
}));
gulp.task('build:scripts', gulp.series('lint:scripts', () => {
    const tokens = $.ini.parse(fs.readFileSync('.config.ini', 'utf-8'));
    return merge(folders(cfg.source_folders.scripts).map((folder) => {
        return $.pump([
            $.rollup({
                'input': `${cfg.source_folders.scripts}/${folder}/index.js`,
                'format': 'iife',
                'name': pkg.title.replace(/\s/g, ''),
                'external': [
                    'idb'
                ],
                'globals': {
                    'idb': 'idb'
                }
            }),
            $.source(folder + '.js'),
            $.buffer(),
            $.tokenReplace({
                'global': tokens,
                'preserveUnknownTokens': true
            }),
            ...Object.keys(cfg.supported_browsers).map(browser => gulp.dest(`./dist/${browser}/scripts`)),
        ]);
    }));
}));


gulp.task('build:vendor', () => {
    return $.pump([
        gulp.src(cfg.vendor_files),
        ...Object.keys(cfg.supported_browsers).map(browser => gulp.dest(`./dist/${browser}/vendor`)),
    ]);
});


// ========================
// package/distribute tasks
// ========================
gulp.task('zip', () => {
    return merge(Object.keys(cfg.supported_browsers).map((browser) => {
        return $.pump([
            gulp.src([`./dist/${browser}/**/*`, '!Thumbs.db']),
            $.zip(`${pkg.name}-${browser}.zip`),
            gulp.dest('./dist'),
        ]);
    }));
});


// =========================
// primary development tasks
// =========================

gulp.task('lint', gulp.parallel(
    'lint:components',
    'lint:helpers',
    'lint:pages',
    'lint:scripts'
));

gulp.task('build', gulp.parallel(
    'build:images',
    'build:logos',
    'build:less',
    'build:locales',
    'build:manifest',
    'build:components',
    'build:pages',
    'build:scripts',
    'build:vendor'
));

gulp.task('watch', (callback) => {
    // TODO: it would be nice to only rebuild the modified files per watch, but that requires a way to pass them to the build task
    gulp.watch(`${cfg.source_folders.locales}/**/*`, gulp.task('build:locales'));
    gulp.watch(`${cfg.source_folders.manifests}/**/*`, gulp.task('build:manifest'));
    gulp.watch(`${cfg.source_folders.components}/**/*`, gulp.task('build:components'));
    gulp.watch(`${cfg.source_folders.less}/**/*`, gulp.task('build:less'));
    gulp.watch(`${cfg.source_folders.pages}/**/*`, gulp.task('build:pages'));
    gulp.watch([
        `${cfg.source_folders.helpers}/**/*.js`,
        `${ cfg.source_folders.scripts }/**/*.js`,
    ], gulp.task('build:scripts'));

    callback();
});

gulp.task('debug', gulp.series('build', 'watch'));
gulp.task('package', gulp.series('clean', 'build', 'minify', 'zip'));

// default task (alias debug)
gulp.task('default', gulp.task('debug'));
