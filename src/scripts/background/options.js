const Options = (() => {

    const OPTS = [

        {
            'id': 'managementPanelType',
            'default': 'tab',
            'visible': true,
            'order': 0,
            'dataType': 'string',
            'uiType': 'radios',
            'values': [
                {
                    'value': 'window',
                },
                {
                    'value': 'tab',
                }
            ]
        },

        {
            'id': 'metadataEnabled',
            'group': 'metadata',
            'default': true,
            'visible': true,
            'order': 2,
            'dataType': 'boolean',
            'uiType': 'radiobuttons',
            'values': [
                {
                    'value': true,
                },
                {
                    'value': false,
                }
            ]
        },

        {
            'id': 'metadataBatchSize',
            'group': 'metadata',
            'default': 96,
            'visible': true,
            'order': 3,
            'dataType': 'number',
            'uiType': 'range',
            'minimum': 16,
            'maximum': 96,
            'condition': 'options.metadataEnabled',
            'options': {
                'floor': 16,
                'ceil': 96,
                'step': 16,
                'showTicks': true,
                'showTicksValues': true
            }
        },

        {
            'id': 'metadataCacheTTL',
            'group': 'metadata',
            'default': 7,
            'visible': true,
            'order': 4,
            'type': 'number',
            'minimum': 0,
            'maximum': 365,
            'condition': 'options.metadataEnabled'
        },

        {
            'id': 'metadataDebug',
            'group': 'metadata',
            'default': false,
            'visible': true,
            'order': 5,
            'type': 'boolean',
            'condition': 'options.metadataEnabled'
        },

        {
            'id': 'placeholders',
            'default': true,
            'visible': true,
            'order': 1,
            'type': 'boolean',
        },

        {
            'id': 'privateStorage',
            'default': 'read',
            'visible': false,
            'dataType': 'string',
            'uiType': 'radios',
            'values': [
                {
                    'value': 'write',
                },
                {
                    'value': 'read',
                },
                {
                    'value': 'none',
                }
            ]
        },

    ];

    const Options = {

        /**
         *
         */
        'initDefaultOptions': async function () {
            console.log('[Background] Options.initDefaultOptions()');

            const data = await browser.storage.sync.get();

            const options = {};
            for (const option of OPTS) {
                if (data[option.id] === undefined) {   //TODO: should this also check for null values?
                    options[option.id] = option.default;
                }
            }

            console.log('[Background] Options.initDefaultOptions() :: Setting Defaults', options);

            return browser.storage.sync.set(options);
        },

        /**
         *
         * @param {string} option the id of the option
         * @param {string} value the value of the option
         */
        'setOption': function (option, value) {
            console.log('[Background] Options.setOption()', option, value);

            const opt = {};
            opt[option] = value;
            return browser.storage.sync.set(opt);
        },

        /**
         *
         * @param {object} option the options
         */
        'setOptions': function (options) {
            console.log('[Background] Options.setOptions()', options);

            return browser.storage.sync.set(options);
        },

        /**
         *
         */
        'getOptions': async function () {
            console.log('[Background] Options.getOptions()');

            const options = OPTS.filter((opt) => opt.visible).sort((a, b) => a.order - b.order);

            const values = await browser.storage.sync.get(options.forEach((opt) => opt.id));

            for (const option of options) {
                option.name = browser.i18n.getMessage(`Option${option.id}Name`);
                option.description = browser.i18n.getMessage(`Option${option.id}Description`);
                option.value = values[option.id];

                if (option.type === 'radio') {
                    for (const val of option.values) {
                        val.label = browser.i18n.getMessage(`Option${option.id}Value${val.value}`);
                    }
                }
            }

            console.log('[Background] Options.getOptions() :: Return', options);

            return { 'options': options };
        },

        /**
         *
         */
        'getOptionsSchemaForm': async function () {
            console.log('[Background] Options.getOptionsSchemaForm()');

            const options = OPTS.filter((opt) => opt.visible).sort((a, b) => a.order - b.order);

            const values = await browser.storage.sync.get(options.forEach((opt) => opt.id));

            const schema = {
                'type': 'object',
                'properties': {},
                'required': []
            };

            let form = [];

            for (const option of options) {
                const prop = {
                    'id': option.id,
                    'title': browser.i18n.getMessage(`Option${option.id}Name`),
                    'description': browser.i18n.getMessage(`Option${option.id}Description`),
                    'type': option.dataType || option.type
                };

                const elem = {
                    'key': option.id,
                    'type': option.uiType,
                    'condition': option.condition,
                    'group': option.group,
                    'options': option.options
                };

                if (option.values !== undefined) {
                    elem.titleMap = [];
                    for (const val of option.values) {
                        elem.titleMap.push({
                            'value': val.value,
                            'name': browser.i18n.getMessage(`Option${option.id}Value${val.value}`)
                        });
                    }
                } else if (option.enum !== undefined && prop.type !== 'string') {
                    elem.titleMap = option.enum.map((val) => {
                        return {
                            'value': val,
                            'name': val
                        };
                    });
                }

                if (prop.type !== 'boolean') {
                    schema.required.push(option.id);
                }

                schema.properties[option.id] = prop;
                form.push(elem);
            }

            const groups = {};
            for (const elem of form) {
                if (elem.group !== undefined) {
                    if (groups[elem.group] === undefined) {
                        groups[elem.group] = {
                            'type': 'panel',
                            'title': browser.i18n.getMessage(`OptionsGroupHeading${elem.group}`),
                            'items': []
                        };
                    }
                    groups[elem.group].items.push(elem);
                }
            }

            for (const group in groups) {
                form.push(groups[group]);
            }

            form = form.filter((elem) => elem.group === undefined);

            console.log('[Background] Options.getOptionsSchemaForm() :: Return', schema, form, values);

            return {
                'schema': schema,
                'form': form,
                'values': values
            };
        }

    };

    return Options;

})();

export default Options;
