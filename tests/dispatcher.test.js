describe('Prism.Dispatcher tests', function() {
    it('Should add methods', function () {
        var dispatcher = new Backbone.Prism.Dispatcher();
        var store = new Backbone.Prism.Store();
        expect(dispatcher.handleViewAction).toBeDefined();
        expect(dispatcher.handleServerAction).toBeDefined();
    });

    it('Should call store method', function () {
        var store = new Backbone.Prism.Store({
            name: 'custom'
        });
        var dispatcher = new Backbone.Prism.Dispatcher();
        var methods = {
            'test-callback': function () {
            }
        };

        spyOn(methods, 'test-callback');
        store.register(dispatcher, methods);
        dispatcher.handleViewAction({
            type: 'custom:test-callback'
        });
        expect(methods['test-callback']).toHaveBeenCalled();
    });

    it('Should broadcast call', function () {
        var dispatcher = new Backbone.Prism.Dispatcher();
        var customStore = new Backbone.Prism.Store({
            name: 'custom'
        });

        var anotherStore = new Backbone.Prism.Store({
            name: 'another'
        });

        var customMethods = {
            'return-name': function () {
                return;
            }
        };

        var anotherMethods = {
            'return-name': function () {
                return;
            }
        };

        spyOn(customMethods, 'return-name');
        spyOn(anotherMethods, 'return-name');

        customStore.register(dispatcher, customMethods);
        anotherStore.register(dispatcher, anotherMethods);
        dispatcher.handleViewAction({
            type: '*:return-name'
        });
        expect(customMethods['return-name']).toHaveBeenCalled();
        expect(anotherMethods['return-name']).toHaveBeenCalled();
        var args = customMethods['return-name'].calls.argsFor(0);
        expect(args[0]).toBeUndefined();
        expect(args[2]).toBe('view');
        var args = anotherMethods['return-name'].calls.argsFor(0);
        expect(args[0]).toBeUndefined();
        expect(args[2]).toBe('view');
    });
});
