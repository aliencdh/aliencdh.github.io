
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/NavBar.svelte generated by Svelte v3.48.0 */

    const file$3 = "src/NavBar.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let a;
    	let h3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			h3 = element("h3");
    			h3.textContent = "home";
    			add_location(h3, file$3, 1, 16, 34);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "svelte-ho68ok");
    			add_location(a, file$3, 1, 4, 22);
    			attr_dev(div, "class", "nav svelte-ho68ok");
    			add_location(div, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
    			append_dev(a, h3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NavBar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NavBar> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBar",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/SectionMarker.svelte generated by Svelte v3.48.0 */

    const file$2 = "src/SectionMarker.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let h3;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = text(" >");
    			attr_dev(h3, "class", "svelte-1jtcu4c");
    			add_location(h3, file$2, 5, 4, 77);
    			attr_dev(div, "class", "marker svelte-1jtcu4c");
    			add_location(div, file$2, 4, 0, 52);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SectionMarker', slots, []);
    	let { title } = $$props;
    	const writable_props = ['title'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SectionMarker> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    	};

    	$$self.$capture_state = () => ({ title });

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title];
    }

    class SectionMarker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SectionMarker",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !('title' in props)) {
    			console.warn("<SectionMarker> was created without expected prop 'title'");
    		}
    	}

    	get title() {
    		throw new Error("<SectionMarker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<SectionMarker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Section.svelte generated by Svelte v3.48.0 */

    const file$1 = "src/Section.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "style", /*style*/ ctx[1]);
    			attr_dev(div, "class", /*div_class*/ ctx[0]);
    			add_location(div, file$1, 15, 0, 311);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[3],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*div_class*/ 1) {
    				attr_dev(div, "class", /*div_class*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Section', slots, ['default']);
    	let { settings = {} } = $$props;
    	let { div_class } = $$props;

    	const style = `
        border-radius: 0 8px 8px 0;
        float: left;
        position: relative;
        top: ${settings.top || 0}%;
        overflow-wrap: break-word;
        hyphens: manual;
        inline-size: 70%;
    `;

    	const writable_props = ['settings', 'div_class'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Section> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('settings' in $$props) $$invalidate(2, settings = $$props.settings);
    		if ('div_class' in $$props) $$invalidate(0, div_class = $$props.div_class);
    		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ settings, div_class, style });

    	$$self.$inject_state = $$props => {
    		if ('settings' in $$props) $$invalidate(2, settings = $$props.settings);
    		if ('div_class' in $$props) $$invalidate(0, div_class = $$props.div_class);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [div_class, style, settings, $$scope, slots];
    }

    class Section extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { settings: 2, div_class: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Section",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*div_class*/ ctx[0] === undefined && !('div_class' in props)) {
    			console.warn("<Section> was created without expected prop 'div_class'");
    		}
    	}

    	get settings() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set settings(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get div_class() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set div_class(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */
    const file = "src/App.svelte";

    // (16:4) <Section div_class="about_me">
    function create_default_slot_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "I'm Alicia, a Netherlands-based fullstack developer.\n        I prefer backend work (such as writing APIs and implementing logic/libraries),\n        but I can handle frontend work,\n        mostly in html-based environments (such as webdev, tauri, electron).\n        I also have knowledge of gamedev (mostly retro 2D games) and algorithms.";
    			add_location(p, file, 16, 8, 385);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(16:4) <Section div_class=\\\"about_me\\\">",
    		ctx
    	});

    	return block;
    }

    // (27:4) <Section div_class="languages">
    function create_default_slot(ctx) {
    	let p;
    	let t1;
    	let ul;
    	let li0;
    	let a0;
    	let t3;
    	let t4;
    	let li1;
    	let a1;
    	let t6;
    	let t7;
    	let li2;
    	let a2;
    	let t9;
    	let t10;
    	let li3;
    	let a3;
    	let t12;
    	let a4;
    	let t14;
    	let t15;
    	let li4;
    	let a5;
    	let t17;
    	let t18;
    	let li5;
    	let a6;
    	let t20;
    	let t21;
    	let li6;
    	let a7;
    	let t23;
    	let t24;
    	let li7;
    	let a8;
    	let t26;
    	let li8;
    	let a9;
    	let t28;
    	let li9;
    	let a10;
    	let t30;
    	let li10;
    	let a11;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "A list of the programming languages I'm confident in (marked with ★),\n            but also any other languages I have enough knowledge to work with:";
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Rust";
    			t3 = text(" ★");
    			t4 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "C++";
    			t6 = text(" ★");
    			t7 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "C";
    			t9 = text(" ★");
    			t10 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "Javascript";
    			t12 = text("/\n                ");
    			a4 = element("a");
    			a4.textContent = "Typescript";
    			t14 = text(" ★");
    			t15 = space();
    			li4 = element("li");
    			a5 = element("a");
    			a5.textContent = "Python";
    			t17 = text(" ★");
    			t18 = space();
    			li5 = element("li");
    			a6 = element("a");
    			a6.textContent = "C#";
    			t20 = text(" ★");
    			t21 = space();
    			li6 = element("li");
    			a7 = element("a");
    			a7.textContent = "Lua";
    			t23 = text(" ★");
    			t24 = space();
    			li7 = element("li");
    			a8 = element("a");
    			a8.textContent = "Haskell";
    			t26 = space();
    			li8 = element("li");
    			a9 = element("a");
    			a9.textContent = "Elixir";
    			t28 = space();
    			li9 = element("li");
    			a10 = element("a");
    			a10.textContent = "Java";
    			t30 = space();
    			li10 = element("li");
    			a11 = element("a");
    			a11.textContent = "NASM x86 assembly";
    			add_location(p, file, 27, 8, 848);
    			attr_dev(a0, "href", "https://www.rust-lang.org/");
    			attr_dev(a0, "class", "svelte-1mkclge");
    			add_location(a0, file, 32, 16, 1055);
    			add_location(li0, file, 32, 12, 1051);
    			attr_dev(a1, "href", "https://en.wikipedia.org/wiki/C++");
    			attr_dev(a1, "class", "svelte-1mkclge");
    			add_location(a1, file, 33, 16, 1124);
    			add_location(li1, file, 33, 12, 1120);
    			attr_dev(a2, "href", "https://en.wikipedia.org/wiki/C_(programming_language)");
    			attr_dev(a2, "class", "svelte-1mkclge");
    			add_location(a2, file, 34, 16, 1199);
    			add_location(li2, file, 34, 12, 1195);
    			attr_dev(a3, "href", "https://en.wikipedia.org/wiki/JavaScript");
    			attr_dev(a3, "class", "svelte-1mkclge");
    			add_location(a3, file, 36, 16, 1310);
    			attr_dev(a4, "href", "https://www.typescriptlang.org/");
    			attr_dev(a4, "class", "svelte-1mkclge");
    			add_location(a4, file, 37, 16, 1393);
    			add_location(li3, file, 35, 12, 1289);
    			attr_dev(a5, "href", "https://www.python.org/");
    			attr_dev(a5, "class", "svelte-1mkclge");
    			add_location(a5, file, 39, 16, 1486);
    			add_location(li4, file, 39, 12, 1482);
    			attr_dev(a6, "href", "https://en.wikipedia.org/wiki/C_Sharp_(programming_language)");
    			attr_dev(a6, "class", "svelte-1mkclge");
    			add_location(a6, file, 40, 16, 1554);
    			add_location(li5, file, 40, 12, 1550);
    			attr_dev(a7, "href", "https://www.lua.org/");
    			attr_dev(a7, "class", "svelte-1mkclge");
    			add_location(a7, file, 41, 16, 1655);
    			add_location(li6, file, 41, 12, 1651);
    			attr_dev(a8, "href", "https://www.haskell.org/");
    			attr_dev(a8, "class", "svelte-1mkclge");
    			add_location(a8, file, 42, 16, 1717);
    			add_location(li7, file, 42, 12, 1713);
    			attr_dev(a9, "href", "https://en.wikipedia.org/wiki/Elixir_(programming_language)");
    			attr_dev(a9, "class", "svelte-1mkclge");
    			add_location(a9, file, 43, 16, 1785);
    			add_location(li8, file, 43, 12, 1781);
    			attr_dev(a10, "href", "https://en.wikipedia.org/wiki/Java_(programming_language)");
    			attr_dev(a10, "class", "svelte-1mkclge");
    			add_location(a10, file, 44, 16, 1887);
    			add_location(li9, file, 44, 12, 1883);
    			attr_dev(a11, "href", "https://www.nasm.us/");
    			attr_dev(a11, "class", "svelte-1mkclge");
    			add_location(a11, file, 45, 16, 1985);
    			add_location(li10, file, 45, 12, 1981);
    			add_location(ul, file, 31, 8, 1034);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(li0, t3);
    			append_dev(ul, t4);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(li1, t6);
    			append_dev(ul, t7);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(li2, t9);
    			append_dev(ul, t10);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(li3, t12);
    			append_dev(li3, a4);
    			append_dev(li3, t14);
    			append_dev(ul, t15);
    			append_dev(ul, li4);
    			append_dev(li4, a5);
    			append_dev(li4, t17);
    			append_dev(ul, t18);
    			append_dev(ul, li5);
    			append_dev(li5, a6);
    			append_dev(li5, t20);
    			append_dev(ul, t21);
    			append_dev(ul, li6);
    			append_dev(li6, a7);
    			append_dev(li6, t23);
    			append_dev(ul, t24);
    			append_dev(ul, li7);
    			append_dev(li7, a8);
    			append_dev(ul, t26);
    			append_dev(ul, li8);
    			append_dev(li8, a9);
    			append_dev(ul, t28);
    			append_dev(ul, li9);
    			append_dev(li9, a10);
    			append_dev(ul, t30);
    			append_dev(ul, li10);
    			append_dev(li10, a11);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(27:4) <Section div_class=\\\"languages\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let navbar;
    	let t0;
    	let h2;
    	let t2;
    	let sectionmarker0;
    	let t3;
    	let section0;
    	let t4;
    	let sectionmarker1;
    	let t5;
    	let section1;
    	let current;
    	navbar = new NavBar({ $$inline: true });

    	sectionmarker0 = new SectionMarker({
    			props: { title: "about me" },
    			$$inline: true
    		});

    	section0 = new Section({
    			props: {
    				div_class: "about_me",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	sectionmarker1 = new SectionMarker({
    			props: { title: "languages" },
    			$$inline: true
    		});

    	section1 = new Section({
    			props: {
    				div_class: "languages",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "Welcome to my humble little personal blog~";
    			t2 = space();
    			create_component(sectionmarker0.$$.fragment);
    			t3 = space();
    			create_component(section0.$$.fragment);
    			t4 = space();
    			create_component(sectionmarker1.$$.fragment);
    			t5 = space();
    			create_component(section1.$$.fragment);
    			attr_dev(h2, "class", "svelte-1mkclge");
    			add_location(h2, file, 12, 4, 249);
    			attr_dev(div, "class", "main svelte-1mkclge");
    			add_location(div, file, 10, 0, 211);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(navbar, div, null);
    			append_dev(div, t0);
    			append_dev(div, h2);
    			append_dev(div, t2);
    			mount_component(sectionmarker0, div, null);
    			append_dev(div, t3);
    			mount_component(section0, div, null);
    			append_dev(div, t4);
    			mount_component(sectionmarker1, div, null);
    			append_dev(div, t5);
    			mount_component(section1, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const section0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				section0_changes.$$scope = { dirty, ctx };
    			}

    			section0.$set(section0_changes);
    			const section1_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				section1_changes.$$scope = { dirty, ctx };
    			}

    			section1.$set(section1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(sectionmarker0.$$.fragment, local);
    			transition_in(section0.$$.fragment, local);
    			transition_in(sectionmarker1.$$.fragment, local);
    			transition_in(section1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(sectionmarker0.$$.fragment, local);
    			transition_out(section0.$$.fragment, local);
    			transition_out(sectionmarker1.$$.fragment, local);
    			transition_out(section1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(navbar);
    			destroy_component(sectionmarker0);
    			destroy_component(section0);
    			destroy_component(sectionmarker1);
    			destroy_component(section1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let about_me = {}; // top: -10
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ NavBar, SectionMarker, Section, about_me });

    	$$self.$inject_state = $$props => {
    		if ('about_me' in $$props) about_me = $$props.about_me;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
