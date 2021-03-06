const Utils = (() => {

    const Utils = {

        /**
         * Breaks an array into an array of smaller arrays of a specified length
         * @param {array} list an array to split into chunks
         * @param {number} size the maximum size of each chunk
         * @returns {array[]} the chunked array
         */
        'ChunkArray': function (list, size) {

            const result = [];

            for (let i = 0; i < list.length; i+=size) {
                result.push(list.slice(i, i + size));
            }

            return result;

        },

        /**
         * Finds the object in an array of objects
         * @param {object} needle the object for which to search
         * @param {object[]} haystack the array of objects through which to search
         * @param {string[]} [properties] an array of properties to search against (uses all properties from `needle` by default)
         * @returns {number} the index of the object in the array
         */
        'FindObjectInArray': function (needle, haystack, properties) {

            if (haystack.length < 1) {
                console.log('Haystack is empty');
                return -1;
            }

            if (properties === undefined || properties === null) {
                console.log('No properties provided to search against');
                properties = Object.keys(needle);
            }

            if (properties.length < 1) {
                throw new Error('No object properties to search against');   //TODO: i18n? for now this is only internal...
            }

            let match, property;

            for (let i = 0; i < haystack.length; i++) {
                match = true;

                // loop through all properties and track if all of them matched or not
                for (let j = 0; j < properties.length; j++) {
                    property = properties[j];
                    if (typeof haystack[i][property] !== 'undefined' && haystack[i][property] !== null) {
                        console.log(`Comparing property "${property}" of needle ("${needle[property]}") against element ${i} ("${haystack[i][property]}") of haystack`);
                        match &= (needle[property] === haystack[i][property]);
                    }
                }

                // if every property matched, then consider the item found
                if (match) {
                    return i;
                }
            }

            return -1;

        },

        /**
         * Uses the Fetch API to make a network request and return the response as parsed JSON
         * @param {string} method the HTTP method
         * @param {USVString|Request} input the resource to fetch
         * @param {Blob|BufferSource|FormData|URLSearchParams|USVString} [data] the data to send
         * @returns {Promise<object>}
         */
        'FetchJSON': function (method, input, data) {

            const headers = new Headers();
            headers.append('Accept', 'application/json');

            const init = {
                'method': method.toUpperCase(),
                'headers': headers
            };

            if (data !== undefined && data !== null) {
                if (init.method === 'GET') {
                    const queryString = this.DataToQueryString(data);
                    if (typeof input === Request) {
                        input.url += (input.url.indexOf('?') === -1) ? '?' : '&';
                        input.url += queryString;
                    } else {
                        input += (input.indexOf('?') === -1) ? '?' : '&';
                        input += queryString;
                    }
                } else {
                    init.body = data;
                }
            }

            return fetch(input, init).then((response) => {
                if (response.ok) {
                    var contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        return response.json();
                    } else {
                        throw new Error('Network response content type was not JSON');   //TODO: i18n? for now this is only internal...
                    }
                } else {
                    throw new Error('Network response was not OK');   //TODO: i18n? for now this is only internal...
                }
            });

        },

        /**
         * Converts a request data object into a query string for GET requests
         * @param {Blob|BufferSource|FormData|URLSearchParams|USVString} data the data object to convert
         * @returns {string} a query string
         */
        'DataToQueryString': function (data) {

            let queryString;

            //TODO: handle the other data types (?)
            //TODO: there must be a simpler way to handle this...
            switch (typeof data) {
                case FormData:
                case URLSearchParams:
                    queryString = [];
                    for (const pair of data.entries()) {
                        if (Array.isArray(pair[1])) {
                            pair[1].forEach((value) => {
                                queryString.push(encodeURIComponent(pair[0]) + '=' + encodeURIComponent(value));
                            });
                        } else {
                            queryString.push(encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]));
                        }
                    }
                    queryString = queryString.join('&');
                    break;

                case 'object':
                    queryString = Object.keys(data).map((key) => {
                        if (Array.isArray(data[key])) {
                            return data[key].map((value) => {
                                return encodeURIComponent(key) + '[]=' + encodeURIComponent(value);
                            }).join('&');
                        } else {
                            return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
                        }
                    }).join('&');
                    break;
            }

            return queryString;

        },

        /**
         * Inserts a parameter and corresponding value into a request data object
         * @param {Blob|BufferSource|FormData|URLSearchParams|USVString} data the data object to modify
         * @param {string} property the name of the parameter
         * @param {value} value the value for the parameter
         * @param {boolean} [force=false] overwrite the existing value if it already exists
         */
        'InsertRequestDataKeyValue': function (data, property, value, force=false) {

            //TODO: handle the other data types (?)
            switch (typeof data) {
                case FormData:
                case URLSearchParams:
                    if (force || !data.has(property)) {
                        data.set(property, value);
                    }
                    break;

                case 'object':
                    if (force || Object.keys(data).indexOf(property) === -1) {
                        data[property] = value;
                    }
                    break;
            }

        }

    };

    return Utils;

})();

export default Utils;
