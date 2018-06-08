import MetadataCache from './metadata-cache';

const Metadata = (() => {

    const Metadata = {

        'enabled': true,

        'useCache': false,

        /**
         *
         */
        'init': async function () {
            console.log('[Content] Metadata.init()');

            browser.runtime.onMessage.addListener(this.onMessage.bind(this));

            const { metadataEnabled } = await browser.storage.sync.get('metadataEnabled');

            this.enabled = metadataEnabled;

            return this.enabled ? this.enable() : this.disable();
        },

        /**
         * Enables and initializes metadata functionality
         */
        'enable': async function () {
            console.log('[Content] Metadata.enable()');

            const { metadataCacheTTL } = await browser.storage.sync.get('metadataCacheTTL');
            this.useCache = parseInt(metadataCacheTTL, 10) > 0;
            this.useCache ? MetadataCache.trim(metadataCacheTTL) : MetadataCache.clear();

            // load metadata for all thumbs already in the DOM
            this.handleThumbs(document.querySelectorAll('span.thumb'));

            const { metadataDebug } = await browser.storage.sync.get('metadataDebug');
            document.querySelector('body').classList.toggle('debug-metadata', metadataDebug);
        },

        /**
         * Disables and resets metadata functionality
         */
        'disable': async function () {
            console.log('[Content] Metadata.disable()');

            MetadataCache.clear();
            document.querySelector('body').classList.remove('debug-metadata');
            //TODO: this should also remove the metadata attributes that have been added to thumbs in the COM
        },

        /**
         * Event listener for browser runtime messages
         * @param {object} message The message
         * @param {runtime.MessageSender} sender The sender of the message
         */
        'onMessage': function (message, sender) {
            console.log('[Content] Metadata.onMessage()', message, sender);

            if (message.action !== undefined) {
                switch (message.action) {
                    case 'toggle-metadata-enabled':
                        this.enabled = message.data.metadataEnabled;
                        this.enabled ? this.enable() : this.disable();
                        break;

                    case 'set-metadata':
                        if (this.enabled) {
                            if (this.useCache) {
                                MetadataCache.save(message.data.metadata);
                            }
                            this.setMetadataOnThumbnails(message.data.metadata, false);
                        }
                        break;

                    case 'metadata-cache-ttl-changed':
                        if (this.enabled) {
                            this.useCache = parseInt(message.data.metadataCacheTTL, 10) > 0;
                            if (this.useCache) {
                                MetadataCache.trim(message.data.metadataCacheTTL);
                            } else {
                                MetadataCache.clear();
                            }
                        }
                        break;

                    case 'toggle-metadata-debug':
                        if (this.enabled) {
                            document.querySelector('body').classList.toggle('debug-metadata', message.data.metadataDebug);
                        }
                        break;
                }
            }

            return true;
        },

        /**
         * Sets metadata as data- attributes on the corresponding thumbnails
         * @param {Object[]} metadata -
         * @param {boolean} [requestMissingMetadata=false] Request missing metadata after processing
         */
        'setMetadataOnThumbnails': function (metadata, requestMissingMetadata = false) {
            console.log('[Content] Metadata.setMetadataOnDeviations()', metadata);

            if (!this.enabled) {
                console.log('[Content] Metadata.setMetadataOnThumbnails() :: Metadata is Disabled');
                return;
            }

            metadata.forEach((meta) => {
                const link = document.querySelector(`a[href*="${meta.url}"]`);

                if (link !== undefined && link !== null) {
                    const thumb = link.parentElement;
                    const target = (thumb !== undefined && thumb !== null) ? thumb : link;

                    if (meta.uuid) {
                        target.setAttribute('data-deviation-uuid', meta.uuid);
                    }

                    if (meta.category_name) {
                        target.setAttribute('data-category', meta.category_name);
                    }

                    if (meta.category_path) {
                        target.setAttribute('data-category-path', meta.category_path);
                    }

                    if (meta.tags && meta.tags.length) {
                        target.setAttribute('data-tags', meta.tags.join(' '));
                    }
                }
            });

            const thumbs = document.querySelectorAll('span.thumb:not([data-deviation-uuid])');
            if (thumbs.length) {
                console.info(`[Content] Metadata.setMetadataOnDeviations() :: There are ${thumbs.length} thumbnails missing metadata (of ${document.querySelectorAll('span.thumb').length} total thumbnails) after inserting metadata`);
                if (requestMissingMetadata) {
                    this.requestMetadataForURL();
                }
            }

            return;
        },

        /**
         * Requests metadata for the specified URL.
         * If no URL is supplied, it will be determined automatically from the current page's URL and DOM content.
         * @param {string} [url]
         */
        'requestMetadataForURL': function (url) {
            console.log('[Content] Metadata.requestMetadataForURL()', url);

            if (!this.enabled) {
                console.log('[Content] Metadata.requestMetadataForURL() :: Metadata is Disabled');
                return;
            }

            if (url === undefined || url === null) {
                const active = document.querySelector('#browse-sidemenu div.browse-facet-order ul li a.selected');
                const sort = active.textContent.replace(/\s/g, '-').replace(/[\']/g, '').toLowerCase();
                let pathname = window.location.pathname;
                console.log('[Content] Metadata.requestMetadataForURL() :: Pathname', pathname);
                if (pathname === undefined || pathname === null || pathname === '' || pathname === '/') {
                    console.log(`[Content] Metadata.requestMetadataForURL() :: Using "${sort}" as Location Pathname`);
                    pathname += sort;
                }
                url = `${window.location.protocol}//${window.location.hostname}${pathname}${window.location.search}`;
            }

            console.log('[Content] Metadata.requestMetadataForURL() :: Requesting Metadata for URL', url);

            return browser.runtime.sendMessage({
                'action': 'send-metadata-to-tab',
                'data': {
                    'url': url
                }
            });
        },

        /**
         * Handles metadata retrieval and/or insertion for the supplied thumbnails
         * @param {NodeList} thumbs
         */
        'handleThumbs': async function (thumbs) {
            console.log('[Content] Metadata.handleThumbs()', thumbs);

            if (!this.enabled) {
                console.log('[Content] Metadata.handleThumbs() :: Metadata is Disabled');
                return;
            }

            if (!thumbs.length) {
                return;
            }

            // try to load metadata from the IndexedDB first
            if (this.useCache) {
                const metadata = await MetadataCache.get(thumbs);
                if (metadata.length) {
                    this.setMetadataOnThumbnails(metadata, true);
                    return;
                }
            }

            // if the cache is disabled, or if there was no cached metadata for the thumbs, use the API
            return this.requestMetadataForURL();
        }
    };

    return Metadata;

})();

export default Metadata;
