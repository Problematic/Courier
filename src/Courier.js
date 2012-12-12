/*jshint node:true */
/*global define:true */
(function (global, undefined) {
    'use strict';

    var _slice = [].slice,
        _merge = function (destination) {
            var sources = _slice.call(arguments, 1), source;

            for (var i = 0; i < sources.length; i++) {
                source = sources[i];
                for (var prop in source) {
                    if (source.hasOwnProperty(prop)) {
                        destination[prop] = source[prop];
                    }
                }
            }

            return destination;
        },
        _parseOptions = function (options) {
            var opts = {
                ephemeral: false,
                transformers: [],
                bubbleErrors: false
            };

            if (typeof options === 'function') {
                opts.transformers = [options];
            } else if (options instanceof Array) {
                opts.transformers = options;
            } else if (typeof options === 'boolean') {
                opts.ephemeral = options;
            } else if (typeof options === 'object') {
                opts = _merge(opts, options);
                if (opts.transformer) {
                    if (opts.transformer instanceof Array) {
                        opts.transformers = opts.transformer;
                    } else {
                        opts.transformers.push(opts.transformer);
                    }
                    delete opts.transformer;
                }
            }

            return opts;
        };

    var Courier = {
        Storage: null,
        EphemeralStorage: null,
        transformers: {},
        getStorage: function (ephemeral) {
            return (ephemeral && this.EphemeralStorage) || this.Storage;
        },
        transform: function (data, options) {
            var transformer;

            for (var i = 0; i < options.transformers.length; i++) {
                transformer = options.transformers[i];
                if (typeof transformer === 'function') {
                    try {
                        data = transformer(data);
                    } catch (e) {
                        if (options.bubbleErrors) {
                            throw e;
                        }
                    }
                }
            }

            return data;
        },
        registerTransformer: function (key, transformer) {
            this.transformers[key] = transformer;
        },

        clear: function (ephemeral) {
            return this.getStorage(ephemeral).clear();
        },
        get: function (key, options) {
            var data;

            options = _parseOptions(options);
            data = this.getStorage(options.ephemeral).getItem(key);

            return this.transform(data, options);
        },
        length: function (ephemeral) {
            return this.getStorage(ephemeral).length;
        },
        remove: function (key, ephemeral) {
            return this.getStorage(ephemeral).removeItem(key);
        },
        set: function (key, data, options) {
            options = _parseOptions(options);
            data = this.transform(data, options);

            return this.getStorage(options.ephemeral).setItem(key, data);
        }
    };

    Courier.registerTransformer('object', function (data) {
        if (typeof data === 'string') {
            return JSON.parse(data);
        } else if (typeof data === 'object') {
            return JSON.stringify(data);
        }

        return data;
    });
    Courier.registerTransformer('boolean', function (data) {
        if (typeof data === 'string') {
            switch (data) {
                case 'true':
                    return true;
                case 'false':
                    return false;
                case 'null':
                    return null;
            }
        }

        return data;
    });

    Courier.Storage = global.localStorage || null;
    Courier.EphemeralStorage = global.sessionStorage || null;

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = Courier;
        }
        exports.Courier = Courier;
    } else {
        global.Courier = Courier;
        if (typeof define === 'function' && typeof define.amd === 'object') {
            define(Courier);
        }
    }
}(this));
