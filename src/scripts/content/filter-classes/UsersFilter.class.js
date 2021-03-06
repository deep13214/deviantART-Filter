import CSSFilter from './CSSFilter.class';

const UsersFilter = (() => {

    const ID = 'users';      // the unique identified for the filter (used as the "key" used for local storage)
    const NAME = 'Users';    // the internal "name" (NOT translated) for the filter (used for retrieving localized messages)
    const LOCAL_STORAGE_KEY = 'hiddenUsers';    // the key used for the legacy web localStorage system (used for migration)

    const RESERVED_SUBDOMAINS = [
        'www',
        'browse',
    ];

    class UsersFilter extends CSSFilter {

        /**
         * Filter constructor
         */
        constructor() {
            super(ID, NAME);
        }

        /**
         * Initializes the filter
         */
        init() {
            console.log('[Content] UsersFilter.init()');

            super.init();

            // migrate filter data from legacy storage to new browser sync storage
            const data = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (data !== undefined && data !== null) {
                const items = JSON.parse(data);
                console.log('[Content] UsersFilter.init() :: Items', items);
                browser.runtime.sendMessage({
                    'action': 'migrate-filter',
                    'data': {
                        'filter': ID,
                        'items': items
                    }
                }).then((response) => {
                    console.log('[Content] UsersFilter.init() :: Response', response);

                    if (!response.error) {
                        localStorage.removeItem(LOCAL_STORAGE_KEY);
                        localStorage.setItem(LOCAL_STORAGE_KEY + 'Backup', data);
                    }
                });
            }
        }

        /**
         * Run whenever the filter data is updated
         * @param {object} filter The filter that was updated
         */
        updateFilter(filter) {
            console.log('[Content] UsersFilter.updateFilter()', filter);

            super.resetFilter();

            filter.data.forEach((item) => {
                const placeholderText = browser.i18n.getMessage('FilterTypeUsersPlaceholderText', [item.username]);

                const browseSelectors = [
                    `.torpedo-container .thumb[href*="//${item.username}.deviantart.com/"]`,                // browse (thumb wall)
                    `.torpedo-container .thumb[href*="//www.deviantart.com/${item.username}/"]`,            // browse (thumb wall)
                    `a.full-view-link[href*="${item.username}.deviantart.com/"]`,                           // browse (full view)
                    `a.full-view-link[href*="www.deviantart.com/${item.username}/"]`                        // browse (full view)
                ];

                const additionalSelectors = [
                    `.thumb a:not(.torpedo-thumb-link)[href*="//${item.username}.deviantart.com/"]`,        // deviation sidebar
                    `.thumb a:not(.torpedo-thumb-link)[href*="//www.deviantart.com/${item.username}/"]`,    // deviation sidebar
                    `*[data-embed-format="thumb"] .thumb[href*="//${item.username}.deviantart.com/"]`,      // comments, journals
                    `*[data-embed-format="thumb"] .thumb[href*="//www.deviantart.com/${item.username}/"]`   // comments, journals
                ];

                super.insertFilterRules(browseSelectors, placeholderText, additionalSelectors);
            });
        }

        /**
         * Adds the hide user corner "button" to thumbs
         * @param {Node[]} thumbs The thumbs to modify
         */
        updateThumbs(thumbs) {
            console.log('[Content] UsersFilter.updateThumbs()', thumbs);

            if (!thumbs.length) {
                return false;
            }

            thumbs.forEach((thumb) => {
                const link = thumb.querySelector('a');
                if (link !== undefined && link !== null) {

                    let username;

                    const url = new URL(link.href);
                    const hostname = url.hostname.split('.');
                    const pathname = url.pathname.split('/');
                    if (hostname.length == 3 && !RESERVED_SUBDOMAINS.includes(hostname[0])) {
                        // classic style: {username}.deviantart.com/art|journal/{deviation-slug}
                        username = hostname[0];
                    } else if (pathname.length > 3) {
                        // new style: [www.]deviantart.com/{username}/art|journal/{deviation-slug}
                        username = pathname[1];
                    }

                    if (username !== undefined && username !== null) {
                        const control = document.createElement('span');
                        control.classList.add('hide-user-corner');
                        control.setAttribute('username', username);
                        control.addEventListener('click', this.toggleUserDeviationClickHandler);
                        link.appendChild(control);
                    } else {
                        console.error('[Content] UsersFilter.updateThumbs() :: Failed to extract username from thumbnail\'s target URL', link.href);
                    }

                } else {
                    console.error('[Content] UsersFilter.updateThumbs() :: Failed to find link element for thumbnail', thumb);
                }
            });
        }

        /**
         * The click event handler for the hide user corner "button" on thumbs
         * @param {Event} event The click event
         */
        toggleUserDeviationClickHandler(event) {
            console.log('[Content] UsersFilter.toggleUserDeviationClickHandler()', event);

            event.preventDefault();
            event.stopPropagation();

            browser.runtime.sendMessage({
                'action': 'toggle-filter-item',
                'data': {
                    'filter': 'users',
                    'item': {
                        'username': event.target.getAttribute('username')
                    }
                }
            });
        }
    }

    return UsersFilter;

})();

export default UsersFilter;
