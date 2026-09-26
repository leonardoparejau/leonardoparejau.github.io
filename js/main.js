(function () {
    'use strict';

    var root = document.documentElement;
    var STORAGE_KEY = 'misof-lang';

    /* ---------------------------------------------------------------
     * i18n — English is authored in the HTML; Spanish comes from
     * translations.js. English strings are captured on load so the
     * page can switch back and forth without a reload.
     * ------------------------------------------------------------- */
    var ES = window.MISOF_I18N_ES || {};
    var EN = { 'contact.copied': 'Copied!' }; // strings that never appear in the markup
    var textEls = Array.prototype.slice.call(document.querySelectorAll('[data-i18n]'));
    var attrEls = Array.prototype.slice.call(document.querySelectorAll('[data-i18n-attr]'));
    var langBlocks = document.querySelectorAll('[data-lang-block]');
    var currentLang = 'en';

    function attrPairs(el) {
        return el.getAttribute('data-i18n-attr').split(';').map(function (pair) {
            return pair.split(':').map(function (s) { return s.trim(); });
        }).filter(function (pair) { return pair.length === 2; });
    }

    textEls.forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (!(key in EN)) EN[key] = el.innerHTML;
    });
    attrEls.forEach(function (el) {
        attrPairs(el).forEach(function (pair) {
            if (!(pair[1] in EN)) EN[pair[1]] = el.getAttribute(pair[0]) || '';
        });
    });

    function t(key) {
        var dict = currentLang === 'es' ? ES : EN;
        return key in dict ? dict[key] : EN[key];
    }

    function readStoredLang() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    function storeLang(lang) {
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage unavailable */ }
    }

    function detectLang() {
        var param = new URLSearchParams(window.location.search).get('lang');
        if (param === 'es' || param === 'en') return param;
        var stored = readStoredLang();
        if (stored === 'es' || stored === 'en') return stored;
        return (navigator.language || '').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
    }

    function applyLang(lang) {
        currentLang = lang;
        textEls.forEach(function (el) {
            var value = t(el.getAttribute('data-i18n'));
            if (value != null) el.innerHTML = value;
        });
        attrEls.forEach(function (el) {
            attrPairs(el).forEach(function (pair) {
                var value = t(pair[1]);
                if (value != null) el.setAttribute(pair[0], value);
            });
        });
        Array.prototype.forEach.call(langBlocks, function (block) {
            block.hidden = block.getAttribute('data-lang-block') !== lang;
        });
        document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
            btn.setAttribute('aria-pressed', String(btn.getAttribute('data-set-lang') === lang));
        });
        root.lang = lang;
    }

    document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var lang = btn.getAttribute('data-set-lang');
            storeLang(lang);
            applyLang(lang);
        });
    });

    applyLang(detectLang());

    /* ---------------------------------------------------------------
     * Header: solid background once the page scrolls
     * ------------------------------------------------------------- */
    var header = document.querySelector('[data-header]');

    function onScroll() {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------------------------------------------------------------
     * Mobile menu
     * ------------------------------------------------------------- */
    var toggle = document.querySelector('.menu-toggle');
    var nav = document.getElementById('site-nav');

    function setMenu(open) {
        header.classList.toggle('is-open', open);
        document.body.classList.toggle('menu-open', open);
        if (toggle) toggle.setAttribute('aria-expanded', String(open));
    }

    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            setMenu(!header.classList.contains('is-open'));
        });
        nav.addEventListener('click', function (e) {
            if (e.target.closest('a')) setMenu(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && header.classList.contains('is-open')) {
                setMenu(false);
                toggle.focus();
            }
        });
        window.matchMedia('(min-width: 961px)').addEventListener('change', function (mq) {
            if (mq.matches) setMenu(false);
        });
    }

    /* ---------------------------------------------------------------
     * Reveal-on-scroll and active nav link
     * ------------------------------------------------------------- */
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var revealEls = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window && !reduceMotion) {
        root.classList.add('reveal-on');
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        revealEls.forEach(function (el) { revealObserver.observe(el); });
    }

    var navLinks = nav ? nav.querySelectorAll('a[href^="#"]') : [];
    if ('IntersectionObserver' in window && navLinks.length) {
        var linkFor = {};
        navLinks.forEach(function (a) { linkFor[a.getAttribute('href').slice(1)] = a; });
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var link = linkFor[entry.target.id];
                if (link && entry.isIntersecting) {
                    navLinks.forEach(function (a) { a.classList.remove('is-active'); });
                    link.classList.add('is-active');
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        Object.keys(linkFor).forEach(function (id) {
            var section = document.getElementById(id);
            if (section) sectionObserver.observe(section);
        });
    }

    /* ---------------------------------------------------------------
     * Copy-to-clipboard
     * ------------------------------------------------------------- */
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
        var label = btn.querySelector('[data-copy-label]');
        var timer;
        btn.addEventListener('click', function () {
            if (!navigator.clipboard) return;
            navigator.clipboard.writeText(btn.getAttribute('data-copy')).then(function () {
                btn.classList.add('is-copied');
                if (label) label.innerHTML = t('contact.copied');
                clearTimeout(timer);
                timer = setTimeout(function () {
                    btn.classList.remove('is-copied');
                    if (label) label.innerHTML = t(label.getAttribute('data-i18n'));
                }, 2000);
            });
        });
    });

    /* ---------------------------------------------------------------
     * Footer year
     * ------------------------------------------------------------- */
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });
})();
