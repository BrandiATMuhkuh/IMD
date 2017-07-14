/**
 * @license
 * Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
(function (scope) {
    'use strict';

    /** @type {Object<key, *>} A mapping of ids to modules. */
    var _modules = Object.create(null);

    // `define`

    /**
     * An AMD-compliant implementation of `define` that does not perform loading.
     *
     * @see https://github.com/amdjs/amdjs-api/wiki/AMD
     *
     * Dependencies must be loaded prior to calling `define`, or you will receive
     * an error.
     *
     * @param {string=} id The id of the module being defined. If not provided,
     *     one will be given to the module based on the document it was called in.
     * @param {Array<string>=} dependencies A list of module ids that should be
     *     exposed as dependencies of the module being defined.
     * @param {function(...*)|*} factory A function that is given the exported
     *     values for `dependencies`, in the same order. Alternatively, you can
     *     pass the exported value directly.
     */
    function define(id, dependencies, factory) {
        // console.log("define", "###id:", id, "###dependecnise", dependencies, "###factory:", factory);
        factory = factory || dependencies || id;
        if (!Array.isArray(dependencies)) {
            // TODO(nevir): Default dependencies should be require, exports, module.
            dependencies = Array.isArray(id) ? id : [];
        }
        var inferredId = _inferModuleId();
        // console.log("inferedId", inferredId);
        if (typeof id !== 'string') {
            id = inferredId;
        }
        // TODO(nevir): Just support \ as path separators too. Yay Windows!
        if (id.indexOf('\\') !== -1) {
            throw new TypeError('Please use / as module path delimiters');
        }
        if (id in _modules) {
            throw new Error('The module "' + id + '" has already been defined');
        }
        // Extract the entire module path up to the file name. Aka `dirname()`.
        //
        // TODO(nevir): This is naive; doesn't support the vulcanize case.
        var base = inferredId.match(/^(.*?)[^\/]*$/)[1];


        id = fixid(id);

        // console.log("base", id);
        _modules[id] = _runFactory(id, base, dependencies, factory);
        return _modules[id];
    }

    /**
     * This functions will remove extract the 'exact' name of the module's name.
     * For example.: fixid(./common/ImdIsCool.js) will extract `ImdIsCool`
     * @param id The id with which we want to save this modul
     * @returns {*} A cleaned up id to support different calls. Particularly when using polymer plus typescript.
     */
    function fixid(id) {
        //split and use last element
        id = id.split("/");
        id = id[id.length - 1];

        //find extentions
        id = id.split(".");
        id = id[0];

        return id
    }

    // Semi-private. We expose this for tests & introspection.
    define._modules = _modules;

    /**
     * Let other implementations know that this is an AMD implementation.
     * @see https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property-
     */
    define.amd = {};

    // Utility

    /** @return {string} A module id inferred from the current document/import. */
    function _inferModuleId() {
        var script = document.currentScript;
        if (script.hasAttribute('as')) {
            return script.getAttribute('as');
        }

        var doc = script && script.ownerDocument || document;
        if (!doc.baseURI) {
            throw new Error('Unable to determine a module id: No baseURI for the document');
        }

        if (script.hasAttribute('src')) {
            // console.log("src", new URL(script.getAttribute('src'), doc.baseURI).toString());
            return new URL(script.getAttribute('src'), doc.baseURI).toString();
        }

        // console.log("bas", doc.baseURI);
        return doc.baseURI;
    }

    /**
     * Calls `factory` with the exported values of `dependencies`.
     *
     * @param {string} id The id of the module defined by the factory.
     * @param {string} base The base path that modules should be relative to.
     * @param {Array<string>} dependencies
     * @param {function(...*)|*} factory
     */
    function _runFactory(moduleId, base, dependencies, factory) {
        if (typeof factory !== 'function') return factory;

        var exports, module;
        var modules = dependencies.map(function (id) {
            if (id === 'exports') {
                return exports = {};
            }
            if (id === 'require') {
                return _require;
            }``
            if (id === 'module') {
                return module = {id: moduleId};
            }
            id = _resolveRelativeId(base, id);
            return _require(id);
        });
        var result = factory.apply(null, modules);
        return (module && module.exports) || exports || result;
    }

    /**
     * @param {string} base The module path/URI that acts as the relative base.
     * @param {string} id The module ID that should be relatively resolved.
     * @return {string} The expanded module ID.
     */
    function _resolveRelativeId(base, id) {
        if (id[0] !== '.') return id;
        // We need to be careful to only process the path of URLs. This regex
        // strips off the URL protocol and domain, leaving us with just the URL's
        // path.
        var match = base.match(/^([^\/]*\/\/[^\/]+\/)?(.*?)\/?$/);
        var prefix = match[1] || '';
        // We start with the base, and then mutate it into the final path.
        var terms = match[2] ? match[2].split('/') : [];
        // Split the terms, ignoring any leading or trailing path separators.
        var idTerms = id.match(/^\/?(.*?)\/?$/)[1].split('/');
        for (var i = 0; i < idTerms.length; i++) {
            var idTerm = idTerms[i];
            if (idTerm === '.') {
                continue;
            } else if (idTerm === '..') {
                terms.pop();
            } else {
                terms.push(idTerm);
            }
        }
        return prefix + terms.join('/');
    }

    function _require(id) {
        // console.log("req", id);
        id = fixid(id);

        if (!(id in _modules)) {
            throw new ReferenceError('The module "' + id + '" has not been loaded');
        }
        return _modules[id];
    }

    // Exports
    scope.define = define;

})(this);
