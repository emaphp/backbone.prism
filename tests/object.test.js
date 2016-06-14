describe('Prism.Object tests', function() {
    it('Should obtain options', function () {
        var obj = new Backbone.Prism.Object({
            test: true
        });

        obj.anotherOption = 'hello';

        expect(obj.getOption('test')).to.be.true;
        expect(obj.getOption('anotherOption')).to.equal('hello');
    });
});
