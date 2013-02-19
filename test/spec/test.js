(function($) {
    $(document).ready(function() {

        var $ele = $('.whee'),
            rslide;
        $ele.rslide();
        rslide = $ele.data('rslide');

        describe('rslide', function() {

            it('should be available on jquery objects', function() {

                expect($.fn.rslide).to.exist;
                expect($ele.rslide).to.exist;
                expect(rslide).to.exist;

            });

            it('should create the right elements', function() {

                expect(rslide.$outer).to.exist;
                expect(rslide.$inner).to.exist;
                expect(rslide.$container).to.exist;
                expect(rslide.$items).to.exist;

            });
        });

        describe('filler', function() {

            var filler = rslide.filler;

            it('should have been instantiated by rslide', function() {

                expect(filler).to.exist;
                expect(filler.$outer).to.exist;
                expect(filler.$inner).to.exist;
                expect(filler.$container).to.exist;
                expect(filler.$items).to.exist;

            });

            it('parses dimension strings', function() {
                expect(filler.parseUnits(11)).to.equal(11);
                expect(filler.parseUnits('11px')).to.equal(11);
                expect(filler.parseUnits('11%', 100)).to.equal(11);
//                expect(filler.parseUnits('stupid string')).to.not.exist;
            });

            it('sets item css', function() {
                var $ele = $('<p></p>');
                $ele = filler.itemCss($ele, 1, 10, 1);
                expect($ele.css('width')).to.equal('10px');
                expect($ele.css('left')).to.equal('11px');
                expect($ele.css('position')).to.equal('absolute');
            });

            it('calcs things', function() {
                expect(filler.getMax(filler.$items, 'height')).to.equal(filler.$items.height());
                expect(filler.calcItemCount(100, 10)).to.equal(10);
                expect(filler.calcItemWidth(100, 10)).to.equal(10);
                expect(filler.containerWidth).to.equal(filler.$inner.width());
                filler.options.items.maxWidth = '25%';
                filler.calcWidths(100);
                expect(filler.maxWidth).to.equal(25);
                expect(filler.minWidth).to.equal(12.5);

            });

            it('gets items to fill correctly', function() {
                var list = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

                expect(filler.getItems(list, 0, 10).length).to.equal(10);
                expect(filler.getItems(list, 0, 10)[0]).to.equal(0);
                expect(filler.getItems(list, 0, 10)[9]).to.equal(9);

                expect(filler.getItems(list, 5, 20).length).to.equal(20);
                expect(filler.getItems(list, 5, 20)[5]).to.equal(0);
                expect(filler.getItems(list, 5, 20)[19]).to.equal(4);

                expect(filler.getItems(list, -1, 10).length).to.equal(10);
                expect(filler.getItems(list, -1, 10)[0]).to.equal(9);
                expect(filler.getItems(list, -1, 10)[9]).to.equal(8);

                expect(filler.getItems(list, -10, 10).length).to.equal(10);
                expect(filler.getItems(list, -10, 10)[0]).to.equal(0);
                expect(filler.getItems(list, -10, 10)[9]).to.equal(9);

            });

        });

        mocha.run();
    });


})(window.jQuery);
