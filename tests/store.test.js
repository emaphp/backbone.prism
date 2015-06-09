describe('Prism.Store tests', function() {
    it('Should create view', function () {
        var TestStore = Backbone.Prism.Store.extend({
            name: 'test'
        });

        var store = new TestStore();
        var view = store.createView({
            name: 'custom'
        });

        expect(view.name).toBe('custom');
        expect(_.toArray(store.views).length).toBe(1);
        expect(store.views.custom).toBeDefined();

        view.destroy();
        expect(_.toArray(store.views).length).toBe(0);
        expect(store.views.default).toBeUndefined();

        var view = store.createView();
        var name = view.name;
        expect(store.views[name]).toBeDefined();
        var otherView = store.getView(name);
        expect(otherView).toBe(view);
        view.destroy();
    });

    it('Should create default view', function () {
        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store();
        expect(store.name).toBe('store');

        var defaultView = store.getDefaultView();
        expect(defaultView.name).toBe('default');
        expect(_.toArray(store.views).length).toBe(1);
        expect(store.views.default).toBeDefined();

        var view = store.getDefaultView();
        expect(view).toBe(defaultView);

        view.destroy();
        expect(_.toArray(store.views).length).toBe(0);
        expect(store.views.default).toBeUndefined();
    });

    it('Should trigger start', function () {
        var listener = {
            callback: function () {
                return;
            }
        };

        spyOn(listener, 'callback');

        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store();
        var view = store.createView();
        expect(store._isInitialized).toBe(false);
        expect(view._isInitialized).toBe(false);

        store.on('start', listener.callback);
        store.start();
        expect(listener.callback).toHaveBeenCalled();
        expect(store._isInitialized).toBe(true);
        expect(view._isInitialized).toBe(true);
    });
});
