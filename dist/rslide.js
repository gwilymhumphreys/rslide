/*! rslide - v0.1.0 - 2013-02-18
* http://gwilymh.com/rslide
* Copyright (c) 2013 Gwilym Humphreys; Licensed MIT */

(function($) {

    /**
     *  rslide - handles setup, input and the slider container
     */
    var RSlide = function(element, options) {

        this.options = options;
        this.initElements(element);
        this.initControls();
        this.offset = 0;
        this.offsetItems = 0;
        this.filler = new Filler(this.$outer, this.$inner, this.$container, this.$items, this.options);

        $(window).on('orientationchange, resize', $.proxy(this.onResize, this));

        if (this.options.pause === 'hover') {
            this.$outer
                .on('mouseenter', $.proxy(this.pause, this))
                .on('mouseleave', $.proxy(this.cycle, this));
        }

        if ($.browser.msie) {
            if (parseInt($.browser.version) < 9) this.terribleBrowser = true;
        }

        this.startOnImagesReady();
    };

    RSlide.prototype = {

        startOnImagesReady: function() {
            var loading,
                $images = $('img', this.$container);

            // Trigger fitting when all images are loaded
            $images.load($.proxy(this.fit, this));

            // Check if images are loaded already and fit immediately if so
            $images.each(function(i, img) {
                if (!img.complete) {
                    loading = true;
                    return false;
                }
            });
            !loading && this.fit();
        },

        fit: function() {
            this.filler.fitItems();
            this.setOffsetByItems(this.offsetItems, 0);
        },

        // Increase our offset by count items
        adjustOffsetByItems: function(count, duration) {
            this.setOffsetByItems(this.offsetItems + count, duration);
            return this;
        },

        // Set our offset to count items
        setOffsetByItems: function(count, duration) {
            this.offsetItems = count;
            this.setOffset(this.offsetItems * this.filler.itemWidth, duration);
            return this;
        },

        setOffset: function(px, duration) {
            var self = this;
            duration = typeof duration !== 'undefined' ? duration : this.options.slider.duration;
            this.sliding = true;
            this.$outer.trigger('sliding');
            this.offset = px;
            if (!this.terribleBrowser) {
                this.$container.transition({ x: -px }, duration, function() {
                    self.sliding = false;
                    self.$container.trigger('slid');
                });
            }
            else {
                this.$container.animate({ left: -px }, duration, function() {
                    self.sliding = false;
                    self.$container.trigger('slid');
                });
            }
            return this;
        },

        prev: function(e) {
            if (e) e.preventDefault();
            if (this.sliding) return;
            this.sliding = true;
            this.adjustOffsetByItems(-this.options.slider.count);
            this.filler.fillPre(this.options.slider.count, true);
            return this;
        },
        next: function(e) {
            if (e) e.preventDefault();
            if (this.sliding) return;
            this.sliding = true;
            this.adjustOffsetByItems(this.options.slider.count);
            this.filler.fillPost(this.options.slider.count, true);
            return this;
        },

        onResize: function(e) {
            this.setOffsetByItems(0, 0);
            this.fit();
        },

        initElements: function(ele) {
            this.$container = $(ele).wrap('<div class="rslide-inner"></div>').css({
                padding: 0,
                width: '99999px',
                margin: '0 auto',
                position: 'relative'
            });
            this.$inner = this.$container.parent().css({
                position: 'relative', // ie7 :|
                overflow: 'hidden'
            });
            this.$inner.wrap('<div class="rslide-outer"></div>');
            this.$outer = this.$inner.parent().css({
                position: 'relative'
            });
            this.$items = this.$container.children().css({
                'list-style': 'none',
                position: 'absolute'
            });
            if (this.options.items.fitImages) {
                this.$items.find(this.options.items.imageSelector).css({
                    width: '100%',
                    height: 'auto'
                });
            }
        },

        initControls: function() {

            if (this.options.controls.create) {
                this.$next = $('<a href="" class="next"></a>').appendTo(this.$outer);
                this.$prev = $('<a href="" class="prev"></a>').appendTo(this.$outer);
            }
            else {
                this.$next = $(this.options.controls.next);
                this.$prev = $(this.options.controls.prev);
            }

            this.$prev.on('click', $.proxy(this.prev, this));
            this.$next.on('click', $.proxy(this.next, this));

            this.$outer.on('swipeleft', $.proxy(this.next, this));
            this.$outer.on('swiperight', $.proxy(this.prev, this));

            return this;
        }

    };


    /**
     *  Filler - handles filling, moving and resizing the slider elements
     */
    var Filler = function(outer, inner, container, items, options) {

        this.$outer = outer;
        this.$inner = inner;
        this.$container = container;
        this.$items = items;
        this.options = options;

        this.containerWidth = this.options.container.width || this.$inner.width();
        this.calcWidths(this.containerWidth);

        this.preIndex = -1;
        this.postIndex = 0;

        this.fillPre(this.options.items.buffer, false);
        this.fillPost(this.options.items.buffer, false);

        this.itemWidth = 0;
    };

    Filler.prototype = {

        // Fill in a number of objects to either side of the current ones
        fillPre: function(count, remove) {
            var self = this,
                toPrepend = this.getItems(this.$items, this.preIndex , count),
                startPoint = this.$container.children().first().position().left;
            [].reverse.call(toPrepend).each(function(i, item) {
                self.$container.prepend(self.itemCss(item, startPoint, self.itemWidth, -(i+1)));
            });
            this.adjustPreIndex(count);
            if (remove) {
                this.removePost(count);
            }
            return this;
        },

        fillPost: function(count, remove) {
            var self = this,
                toAppend = this.getItems(this.$items, this.postIndex, count),
                startPoint = this.$container.children().last().position().left;
            toAppend.each(function(i, item) {
                self.$container.append(self.itemCss(item, startPoint, self.itemWidth, i+1));
            });
            this.adjustPostIndex(count);
            if (remove) {
                this.removePre(count);
            }
            return this;
        },

        removePre: function(count) {
            var $items = this.$container.children();
            $items.slice(0, count).remove();
            this.adjustPreIndex(-count);
            return this;
        },
        removePost: function(count) {
            var $items = this.$container.children();
            $items.slice(-count).remove();
            this.adjustPostIndex(-count);
            return this;
        },

        // Increase pre / post index by count
        adjustPreIndex: function(count) {
            this.preIndex = (this.preIndex - count) % this.$items.length;
            return this;
        },
        adjustPostIndex: function(count) {
            this.postIndex = (this.postIndex + count) % this.$items.length;
            return this;
        },

        // calc item width and count and apply
        fitItems: function() {
            var self = this,
                currentWidth = this.$inner.width(),
                maxHeight = 0;

            this.itemCount = this.calcItemCount(currentWidth, this.maxWidth);
            this.itemWidth = this.calcItemWidth(currentWidth, this.itemCount);

            this.$container.children().each(function(i, item) {
                var h = $(item).css({
                    width: self.itemWidth + 'px',
                    left: (i-self.options.items.buffer)*self.itemWidth + 'px'
                }).height();
                maxHeight = h > maxHeight ? h : maxHeight;
            });

            this.$container.height(maxHeight);
            return this;
        },

        // Set container, min and max widths
        calcWidths: function(containerWidth) {
            // Calc min max widths before fitting items
            this.maxWidth = this.parseUnits(this.options.items.maxWidth, containerWidth) ||
                this.getMax(this.$items, 'width');
            this.minWidth = this.parseUnits(this.options.items.minWidth, containerWidth) ||
                this.maxWidth / 2;
            return this;
        },

        //todo: min widths
        calcItemCount: function(containerWidth, itemWidth) {
            return Math.ceil(containerWidth / itemWidth);
        },

        calcItemWidth: function(containerWidth, count) {
            return containerWidth / count;
        },

        getMax: function(items, fn) {
            var max = -Infinity;
            items.each(function(i, item) {
                var m = fn ? $(item)[fn]() : item;
                if (m > max) {
                    max = m;
                }
            });
            return max;
        },

        parseUnits: function(width, containerWidth) {

            if (typeof width == 'string') {
                if (width.charAt(width.length - 1) == '%') {
                    return containerWidth *  (width.slice(0, width.length - 1)/100);
                }
                else {
                    if (width.slice(-2, width.length) !== 'px') {
                        if (console) console.log('rslide: options.items.(max|min)Width must either be undefined, a number, or end with `%` or `px`. You provided: ', width, '('+typeof width+')');
                    }
                    return parseFloat(width);
                }
            }

            else if (typeof width == 'number') {
                return width;
            }

            return undefined;
        },

        itemCss: function(item, start, width, count) {
            var offset = (start + count*width) + 'px',
                $item = $(item).css({
                    width: width + 'px',
                    position: 'absolute',
                    left: offset
                });
            return $item;
        },

        // Get a number of items from source array / jQuery object
        // If the starting `index` is negative will operate in reverse from the end of the source
        // Items will always be returned in the order they appear in source
        // Repeats objects to make up `count` items
        getItems: function(source, index, count) {
            var items, end,
                wrapIndex = 0,
                wrap = 0;

            source = source.clone ? source.clone() : source;

            if (index < 0) {
                index = (source.length + index) % source.length;
            }
            end = index + count;
            wrap = end - source.length;
            items = source.slice(index, end);

            if (wrap > 0) {
                var wrapped = this.getItems(source, wrapIndex, wrap);
                $.merge(items, wrapped);
            }

            return items;
        }

    };


    /**
     * Define the plugin and handle subsequent commands
     */
    $.fn.rslide = function (option) {
        return this.each(function() {
            var $this = $(this),
                data = $this.data('rslide'),
                options = $.extend({}, $.fn.rslide.defaults, typeof option == 'object' && option),
                action = typeof option == 'string' ? option : options.slide;
            if (!data) $this.data('rslide', (data = new RSlide(this, options)));
            if (typeof option == 'number') data.to(option);
            else if (action) data[action]();
            else if (options.interval) data.cycle();
        });
    };


    $.fn.rslide.defaults = {
        items: {
            minWidth: undefined,
            maxWidth: '25%',
            min: 2,
            max: 4,
            buffer: 1,
            fitImages: true,
            imageSelector: 'img'
        },
        container: {
            width: undefined
        },
        slider: {
            count: 1,
            duration: 300
        },
        controls: {
            next: '',
            prev: '',
            create: true
        },
        pause: 'hover'
    };

    $.fn.rslide.Constructor = RSlide;

}(jQuery));
