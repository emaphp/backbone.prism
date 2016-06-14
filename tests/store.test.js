describe('Prism.Store tests', function() {
    it('Should create view', function () {
        var TestStore = Backbone.Prism.Store.extend({
            name: 'test'
        });

        var store = new TestStore();
        var view = store.createView({
            name: 'custom'
        });

        expect(view.name).to.equal('custom');
        expect(_.toArray(store.views).length).to.equal(1);
        expect(store.views.custom).to.exist;

        view.destroy();
        expect(_.toArray(store.views).length).to.equal(0);
        expect(store.views.default).to.be.undefined;

        var view = store.createView();
        var name = view.name;
        expect(store.views[name]).to.exist;
        var otherView = store.getView(name);
        expect(otherView).to.equal(view);
        view.destroy();
    });

    it('Should create default view', function () {
        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store();
        expect(store.name).to.equal('store');

        var defaultView = store.getDefaultView();
        expect(defaultView.name).to.equal('default');
        expect(_.toArray(store.views).length).to.equal(1);
        expect(store.views.default).to.exist;

        var view = store.getDefaultView();
        expect(view).to.equal(defaultView);

        view.destroy();
        expect(_.toArray(store.views).length).to.equal(0);
        expect(store.views.default).to.be.undefined;
    });

    it('Should trigger publish', function () {
        var listener = {
            callback: function () {
                return;
            }
        };

        var spy = sinon.spy(listener, 'callback');

        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store();
        var view = store.createView();
        expect(store._isInitialized).to.be.false;
        expect(view._isInitialized).to.be.false;

        store.on('publish', listener.callback);
        store.publish();
        expect(spy.called).to.be.true;
        expect(store._isInitialized).to.be.true;
        expect(view._isInitialized).to.be.true;
    });
});
