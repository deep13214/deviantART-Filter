import Utils from '../../../helpers/utils';
import BrowserTabs from '../browser-tabs';

const Filter = (() => {

    class Filter {

        /**
         * Filter constructor
         * @param {string} id The unique identified for the filter (used as the "key" used for local storage)
         * @param {string} name The internal "name" (NOT translated) of the filter (used for retrieving localized messages)
         * @param {object[]} properties The properties available for the filter to utilize
         * @param {string[]} [dependencies] The list of dependencies for the filter to work
         */
        constructor(id, name, properties, dependencies = null) {
            this.id = id;
            this.name = name;
            this.properties = properties;
            this.dependencies = dependencies;
        }

        /**
         * Returns a "friendly" name for the filter item
         * @param {object} item The filter item
         * @returns {string} The "friendly" display string
         */
        getDisplayLabel(item) {
            let label = browser.i18n.getMessage(`FilterType${this.name}Name`);

            const props = this.properties.filter(property => property.required).map(property => property.field);
            if (props.length) {
                // include the first required property, assuming it is the most important
                label += ` "${item[props[0]]}"`;
            }

            return label;
        }

        /**
         * Gets the meta data for the filter
         * @returns {Object} The meta data for the filter
         */
        async getMetaData() {
            console.log(`${this.name}.getMetaData()`);
            return {
                'id': this.id,
                'name': {
                    'singular': browser.i18n.getMessage(`FilterType${this.name}Name`),
                    'plural': browser.i18n.getMessage(`FilterType${this.name}NamePlural`)
                },
                'properties': this.properties,
                'dependencies': this.dependencies,
                'labels': {
                    'none': browser.i18n.getMessage(`FilterType${this.name}LabelNone`),
                    'help': browser.i18n.getMessage(`FilterType${this.name}LabelHelp`)
                },
                'enabled': await this.isEnabled()
            };
        }

        /**
         * Determines if the filter is enabled (by checking the declared dependencies)
         * @returns {boolean} Whether the filter is enabled or not
         */
        async isEnabled() {
            console.log(`${this.name}.isEnabled()`);

            let enabled = true;
            if (this.dependencies !== undefined || this.dependencies !== null || this.dependencies.length > 0) {

                const { metadataEnabled } = await browser.storage.sync.get('metadataEnabled');

                for (let i = 0; i < this.dependencies.length; i++) {
                    switch (this.dependencies[i]) {
                        case 'metadata':
                            enabled &= metadataEnabled;
                            break;
                    }
                }

            }

            console.log(`${this.name}.isEnabled() :: Return`, enabled);
            return enabled;
        }

        /**
         * Gets the list of filtered items
         * @param {number} [limit] The limit of filtered items to retrieve
         * @param {number} [offset] The starting index of filtered items to retrieve
         * @returns {Object[]} The list of filtered items
         */
        async getItems(limit, offset) {
            console.log(`${this.name}.getItems()`, limit, offset);

            const data = await browser.storage.local.get(this.id);
            const items = data[this.id];

            if (items === undefined || items === null) {
                return [];
            }

            if (limit === undefined || limit === null) {
                limit = items.length;
            }

            if (offset === undefined || offset === null) {
                offset = 0;
            }

            return items.slice(offset, limit);
        }

        /**
         * Sends data needed by the filter to a specific tab
         * @param {tab} tab The browser tab to which the filter data should be sent
         */
        async sendFilterDataToTab(tab) {
            console.log(`${this.name}.sendFilterDataToTab()`, tab);

            const items = await this.getItems();

            return BrowserTabs.sendMessageToTab(tab, {
                'action': 'update-filter',
                'data': {
                    'filter': {
                        'id': this.id,
                        'enabled': await this.isEnabled(),
                        'data': items
                    }
                }
            });
        }

        /**
         * Sends the updated data needed by the filter to all browser tabs
         */
        async sendFilterDataToAllTabs() {
            console.log(`${this.name}.sendFilterDataToAllTabs()`);

            const items = await this.getItems();

            return BrowserTabs.sendMessageToAllTabs({
                'action': 'update-filter',
                'data': {
                    'filter': {
                        'id': this.id,
                        'enabled': await this.isEnabled(),
                        'data': items
                    }
                }
            });
        }

        /**
         * Event handler for when a dependency has changed
         * @param {string} dependency the name of the dependency that has changed
         * @param {*} oldValue the old value of the dependency
         * @param {*} newValue the new value of the dependency
         */
        async onDependencyChange(dependency, oldValue, newValue) {
            console.log(`${this.name}.checkDependencyChange()`, dependency, oldValue, newValue);

            if (this.dependencies !== undefined || this.dependencies !== null || this.dependencies.length > 0) {
                if (this.dependencies.indexOf(dependency) !== -1) {
                    //TODO: some dependencies may require additional logic to determine if an update should be sent
                    return this.sendFilterDataToAllTabs();
                }
            }

            return false;
        }

        /**
         * Normalizes all properties on a filter object
         * @param {object} item Object representing a filterable item
         * @returns {object} The normalized item object
         */
        normalize(item) {
            return item;
        }

        /**
         * Validates all required properties on a filter object
         * @param {object} item Object representing a filterable item
         * @returns {boolean} True if the item is valid
         */
        isValid(item) {
            console.log(`${this.name}.isValid()`);

            const props = this.properties.filter(property => property.required);
            for (let i = 0; i < props.length; i++) {
                const prop = props[i];

                if (item[prop.field] === undefined) {
                    console.log(`Required property "${prop.title}" is missing`);
                    return false;
                }

                const value = item[prop.field];

                if ((prop.type === 'text') && !value.length) {
                    console.log(`Property "${prop.title}" is empty`);
                    return false;
                }

                if (prop.pattern !== undefined) {
                    const regex = new RegExp(`^${prop.pattern}$`); // wrap the pattern in start and end boundaries
                    console.log(`Checking property "${prop.title}" against pattern`, regex, value);
                    if (regex.test(value) === false) {
                        console.log(`Property "${prop.title}" does not match the expected pattern`);
                        return false;
                    }
                }
            }

            return true;
        }

        /**
         * Determines if the item is already filtered or not
         * @param {object} item Object representing a filterable item
         * @returns {boolean} True if the item is already filtered
         */
        async exists(item) {
            console.log(`${this.name}.exists()`, item);

            item = this.normalize(item);

            const props = this.properties.filter(property => property.required).map(property => property.field);

            const items = await this.getItems();

            return (Utils.FindObjectInArray(item, items, props) >= 0);
        }

        /**
         * Imports the provided items into the filter
         * @param {object[]} newItems The filter items to import
         * @returns {object} A summary of the import results
         */
        async import(newItems) {
            console.log(`${this.name}.import()`, newItems);

            const props = this.properties.filter(property => property.required).map(property => property.field);

            const results = {
                'total': newItems.length,
                'success': 0,
                'invalid': 0,
                'duplicate': 0
            };

            const items = await this.getItems();

            for (let item of newItems) {
                item = this.normalize(item);

                if (!this.isValid(item)) {
                    console.log('Invalid item', item);
                    results.invalid++;
                    continue;
                }

                const idx = Utils.FindObjectInArray(item, items, props);
                if (idx >= 0) {
                    console.log('Duplicate item', item);
                    results.duplicate++;
                } else {
                    item.created = Date.now();
                    items.push(item);
                    results.success++;
                }
            }

            const data = {};
            data[this.id] = items;
            browser.storage.local.set(data);

            return results;
        }

        /**
         * Filters the item
         * @param {object} item Object representing a filterable item
         * @param {number} [limit] The limit of filtered items to return
         * @param {number} [offset] The starting index of filtered items to return
         * @returns {object[]} Array of currently filtered items
         */
        async add(item, limit, offset) {
            console.log(`${this.name}.add()`, item);

            item = this.normalize(item);

            if (!this.isValid(item)) {
                throw new Error(browser.i18n.getMessage('ErrorInvalidFilterItem', [this.getDisplayLabel(item)]));
            }

            const props = this.properties.filter(property => property.required).map(property => property.field);

            const items = await this.getItems();

            const idx = Utils.FindObjectInArray(item, items, props);
            if (idx >= 0) {
                throw new Error(browser.i18n.getMessage('ErrorDuplicateFilterItem', [this.getDisplayLabel(item)]));
            }

            item.created = Date.now();
            items.push(item);

            const data = {};
            data[this.id] = items;
            browser.storage.local.set(data);

            return this.getItems(limit, offset);
        }

        /**
         * Un-filters the item
         * @param {object} item Object representing a filterable item
         * @param {number} [limit] The limit of filtered items to return
         * @param {number} [offset] The starting index of filtered items to return
         * @returns {object[]} Array of currently filtered items
         */
        async remove(item, limit, offset) {
            console.log(`${this.name}.remove()`, item);

            item = this.normalize(item);

            const props = this.properties.filter(property => property.required).map(property => property.field);

            const items = await this.getItems();

            const idx = Utils.FindObjectInArray(item, items, props);
            if (idx < 0) {
                throw new Error(browser.i18n.getMessage('ErrorMissingFilterItem', [this.getDisplayLabel(item)]));
            }

            items.splice(idx, 1);

            const data = {};
            data[this.id] = items;
            browser.storage.local.set(data);

            return this.getItems(limit, offset);
        }

        /**
         * Filters or un-filters the item
         * @param {object} item Object representing an item to be filtered/un-filtered
         * @param {number} [limit] The limit of filtered items to return
         * @param {number} [offset] The starting index of filtered items to return
         * @returns {object[]} Array of currently filtered items
         */
        async toggle(item) {
            console.log(`${this.name}.toggle()`, item);

            item = this.normalize(item);

            const exists = await this.exists(item);
            return exists ? this.remove(item) : this.add(item);
        }

    }

    return Filter;

})();

export default Filter;
