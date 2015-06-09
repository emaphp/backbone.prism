describe('Prism.Object tests', function() {
    it('Should obtain options', function () {
        var obj = new Backbone.Prism.Object({
            test: true
        });

        obj.anotherOption = 'hello';

        expect(obj.getOption('test')).toBe(true);
        expect(obj.getOption('anotherOption')).toBe('hello');
    });
});
