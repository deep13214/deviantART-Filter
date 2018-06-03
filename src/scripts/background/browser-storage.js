import BrowserTabs from './browser-tabs';
import Filters from './filters';

const BrowserStorage = (() => {

    const BrowserStorage = {

        'onStorageChanged': function (changes, area) {
            console.log('[Background] Storage.onStorageChanged()', changes, area);

            switch (area) {
                case 'sync': return this.onSyncStorageChanged(changes);
                case 'local': return this.onLocalStorageChanged(changes);
                case 'managed': return this.onManagedStorageChanged(changes);
            }
        },

        /**
         * Handler for all changes to data in synchronized storage area
         * @param {object} changes object describing the change
         */
        'onSyncStorageChanged': function (changes) {
            console.log('[Background] Storage.onSyncStorageChanged()', changes);

            for (const item of Object.keys(changes)) {
                if (changes[item].oldValue === changes[item].newValue) {
                    continue;
                }

                let message;

                switch (item) {
                    case 'metadataEnabled':
                        Filters.onDependencyChange('metadata', changes[item].oldValue, changes[item].newValue);
                        message = {
                            'action': 'toggle-metadata-enabled',
                            'data': {
                                'metadataEnabled': changes[item].newValue
                            }
                        };
                        break;

                    case 'metadataCacheTTL':
                        message = {
                            'action': 'metadata-cache-ttl-changed',
                            'data': {
                                'metadataCacheTTL': changes[item].newValue
                            }
                        };
                        break;

                    case 'metadataDebug':
                        message = {
                            'action': 'toggle-metadata-debug',
                            'data': {
                                'metadataDebug': changes[item].newValue
                            }
                        };
                        break;

                    case 'placeholders':
                        message = {
                            'action': 'toggle-placeholders',
                            'data': {
                                'placeholders': changes[item].newValue
                            }
                        };
                        break;

                    default:
                        message = null;
                        break;
                }

                if (message !== undefined && message !== null) {
                    BrowserTabs.sendMessageToAllTabs(message);
                    browser.runtime.sendMessage(message);
                    message = null;
                }
            }
        },

        /**
         * Handler for all changes to data in local storage area
         * @param {object} changes object describing the change
         */
        'onLocalStorageChanged': function (changes) {
            console.log('[Background] Storage.onLocalStorageChanged()', changes);

            for (const item of Object.keys(changes)) {
                const filter = Filters.getAvailableFilters().find((filter) => filter.id == item);
                if (filter !== undefined && filter !== null) {
                    filter.sendFilterDataToAllTabs();
                }
            }
        },

        /**
         * Handler for all changes to data in managed storage area
         * @param {object} changes object describing the change
         */
        'onManagedStorageChanged': function (changes) {
            console.log('[Background] Storage.onManagedStorageChanged()', changes);
        },

        /**
         * Handler for all changes to storage data, regardless of storage area/type
         * @param {object} changes object describing the change
         */
        'onAnyStorageChanged': function (changes) {
            console.log('[Background] Storage.onAnyStorageChanged()', changes);
        }

    };

    return BrowserStorage;

})();

export default BrowserStorage;
