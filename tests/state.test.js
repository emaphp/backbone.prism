describe('Prism.State tests', function() {
    it('Should create view', function () {
        var TestState = Backbone.Prism.State.extend({
            name: 'test'
        });

        var state = new TestState();
        var view = state.createView({
            name: 'custom'
        });

        expect(view.name).toBe('custom');
        expect(_.toArray(state.views).length).toBe(1);
        expect(state.views.custom).toBeDefined();

        view.destroy();
        expect(_.toArray(state.views).length).toBe(0);
        expect(state.views.default).toBeUndefined();

        var view = state.createView();
        var name = view.name;
        expect(state.views[name]).toBeDefined();
        var otherView = state.getView(name);
        expect(otherView).toBe(view);
        view.destroy();
    });

    it('Should create default view', function () {
        var State = Backbone.Prism.State.extend({
            name: 'state'
        });

        var state = new State();
        expect(state.name).toBe('state');

        var defaultView = state.getDefaultView();
        expect(defaultView.name).toBe('default');
        expect(_.toArray(state.views).length).toBe(1);
        expect(state.views.default).toBeDefined();

        var view = state.getDefaultView();
        expect(view).toBe(defaultView);

        view.destroy();
        expect(_.toArray(state.views).length).toBe(0);
        expect(state.views.default).toBeUndefined();
    });

    it('Should trigger start', function () {
        var listener = {
            callback: function () {
                return;
            }
        };

        spyOn(listener, 'callback');

        var State = Backbone.Prism.State.extend({
            name: 'state'
        });

        var state = new State();
        var view = state.createView();
        expect(state._isInitialized).toBe(false);
        expect(view._isInitialized).toBe(false);

        state.on('start', listener.callback);
        state.start();
        expect(listener.callback).toHaveBeenCalled();
        expect(state._isInitialized).toBe(true);
        expect(view._isInitialized).toBe(true);
    });
});
