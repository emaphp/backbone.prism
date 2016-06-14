describe('Prism.State tests', function() {
    it('Should create view', function () {
        var TestState = Backbone.Prism.State.extend({
            name: 'test'
        });

        var state = new TestState();
        var view = state.createView({
            name: 'custom'
        });

        expect(view.name).to.equal('custom');
        expect(_.toArray(state.views).length).to.equal(1);
        expect(state.views.custom).to.exist;

        view.destroy();
        expect(_.toArray(state.views).length).to.equal(0);
        expect(state.views.default).to.be.undefined;

        var view = state.createView();
        var name = view.name;
        expect(state.views[name]).to.exist;
        var otherView = state.getView(name);
        expect(otherView).to.equal(view);
        view.destroy();
    });

    it('Should create default view', function () {
        var State = Backbone.Prism.State.extend({
            name: 'state'
        });

        var state = new State();
        expect(state.name).to.equal('state');

        var defaultView = state.getDefaultView();
        expect(defaultView.name).to.equal('default');
        expect(_.toArray(state.views).length).to.equal(1);
        expect(state.views.default).to.exist;

        var view = state.getDefaultView();
        expect(view).to.equal(defaultView);

        view.destroy();
        expect(_.toArray(state.views).length).to.equal(0);
        expect(state.views.default).to.be.undefined;
    });

    it('Should trigger publish', function () {
        var listener = {
            callback: function () {
                return;
            }
        };

        var spy = sinon.spy(listener, 'callback');

        var State = Backbone.Prism.State.extend({
            name: 'state'
        });

        var state = new State();
        var view = state.createView();
        expect(state._isInitialized).to.be.false;
        expect(view._isInitialized).to.be.false;

        state.on('publish', listener.callback);
        state.publish();
        expect(spy.called).to.be.true;
        expect(state._isInitialized).to.be.true;
        expect(view._isInitialized).to.be.true;
    });
});
