'use strict';

const filterhtml = require('filterhtml');
const html2text = require('html-to-text');
const marked = require('marked');
const minify = require('html-minifier').minify;
const through = require('through2');

module.exports = function (verb) {
    verb.use(require('verb-generate-readme'));
    verb.use(require('verb-toc'));

    verb.task('chrome-readme', () => {
        return verb.src('./docs/chrome/.verb.md')
            .pipe(verb.renderFile('md'))
            .pipe(verb.dest((file) => {
                file.path = './docs/chrome/README.md';
                return file.base;
            }));
    });

    verb.task('chrome-description', ['chrome-readme'], () => {
        return verb.src('./docs/chrome/README.md')
            .pipe(through.obj((file, enc, next) => {
                const content = file.contents.toString(); // get the README contents as a string
                const html = marked(content); // convert the markdown to HTML

                let text = html2text.fromString(html, { // convert the HTML to formatted plaintext
                    'wordwrap': false,
                    'ignoreHref': true,
                    'ignoreImage': true,
                    'preserveNewlines': true,
                    'unorderedListItemPrefix': '- '
                });

                text = text.replace(/^\s+$/gm, ''); // remove lines with only whitespace characters

                text = text.replace(/(\S)(- .*)\n/gm, '$1\n    $2\n'); // fix sub-bullets not starting on their own line

                file.contents = text;
                next(null, file);
            }))
            .pipe(verb.dest((file) => {
                file.path = './docs/chrome/description.txt';
                return file.base;
            }));
    });

    verb.task('chrome', ['chrome-readme', 'chrome-description']);

    verb.task('firefox-readme', () => {
        return verb.src('./docs/firefox/.verb.md')
            .pipe(verb.renderFile('md'))
            .pipe(verb.dest((file) => {
                file.path = './docs/firefox/README.md';
                return file.base;
            }));
    });

    verb.task('firefox', ['firefox-readme', 'firefox-description']);

    verb.task('firefox-description', ['firefox-readme'], () => {
        return verb.src('./docs/firefox/README.md')
            .pipe(through.obj((file, enc, next) => {
                const content = file.contents.toString(); // get the README contents as a string
                let html = marked(content); // convert the markdown to HTML

                html = minify(html, {
                    //'collapseWhitespace': true,
                    //'conservativeCollapse': true,
                    'decodeEntities': true,
                    //'preserveLineBreaks': true,
                    'removeEmptyElements': true
                });

                html = filterhtml.filter_html(html, {
                    'a': { // only allow external links (except links to deviantart.com)
                        'href': /^https?:\/\/(?!(?:www\.?)?deviantart\.com).*$/,
                        'title': {}
                    },

                    'abbr': {
                        'title': {}
                    },

                    'acronym': {
                        'title': {}
                    },

                    'h1': 'strong',
                    'h2': 'strong',
                    'h3': 'strong',
                    'h4': 'em',
                    'h5': 'em',
                    'h6': 'em',

                    'b': {},
                    'strong': {},
                    'i': {},
                    'em': {},

                    'blockquote': {},

                    'code': {},

                    'ol': {},
                    'ul': {},
                    'li': {}
                });

                html = html.replace(/<a>([^<]+)<\/a>/gim, '$1'); // remove empty anchor tags

                file.contents = html;
                next(null, file);
            }))
            .pipe(verb.dest((file) => {
                file.path = './docs/firefox/description.html';
                return file.base;
            }));
    });

    verb.task('deviantart-description', () => {
        return verb.src('./docs/deviantart/.verb.md')
            .pipe(verb.renderFile('md'))
            .pipe(through.obj((file, enc, next) => {
                const content = file.contents.toString(); // get the README contents as a string
                let html = marked(content); // convert the markdown to HTML

                html = minify(html, {
                    //'collapseWhitespace': true,
                    //'conservativeCollapse': true,
                    'decodeEntities': true,
                    //'preserveLineBreaks': true,
                    'removeEmptyElements': true
                });

                html = filterhtml.filter_html(html, {
                    'a': { // only allow external links (except links to deviantart.com)
                        'href': /^https?:\/\/(?!(?:www\.?)?deviantart\.com).*$/,
                        'title': {}
                    },

                    'abbr': {
                        'title': {}
                    },

                    'acronym': {
                        'title': {}
                    },

                    'h1': {},
                    'h2': {},
                    'h3': {},
                    'h4': 'strong',
                    'h5': 'em',
                    'h6': 'span',

                    'b': {},
                    'strong': {},
                    'i': {},
                    'em': {},

                    'blockquote': {},

                    'code': {},

                    'ol': {},
                    'ul': {},
                    'li': {},

                    'hr': {}
                });

                html = html.replace(/<a>([^<]+)<\/a>/gim, '$1'); // remove empty anchor tags

                html = html.replace(/<(\/?)h(\d)([^>]*)>/gim, (match, $1, $2) => { // make all headings one size smaller
                    const tag = 'h' + (parseInt($2, 10) + 1);
                    return `<${$1}${tag}>`;
                });

                file.contents = html;
                next(null, file);
            }))
            .pipe(verb.dest((file) => {
                file.path = './docs/deviantart/description.html';
                return file.base;
            }));
    });

    verb.task('default', ['chrome', 'firefox', 'deviantart-description', 'readme']);
};
