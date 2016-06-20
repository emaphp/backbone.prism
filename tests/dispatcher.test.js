describe('Prism.Dispatcher tests', function() {
    it('Should have additional handling methods', function () {
        var dispatcher = new Backbone.Prism.Dispatcher();
        var store = new Backbone.Prism.Store();
        expect(dispatcher.handleViewAction).to.exist;
        expect(dispatcher.handleServerAction).to.exist;
    });

    it('Should call store method', function () {
        var store = new Backbone.Prism.Store();
        var dispatcher = new Backbone.Prism.Dispatcher();
        var methods = {
            'test-callback': function () {
            }
        };

        var methodSpy = sinon.spy(methods, 'test-callback');
        dispatcher.register(function(payload) {
            var action = payload.action;
            switch (payload.action.type) {
            case 'test-callback':
                methods['test-callback']();
				        break;
            default:
            }
        });

        dispatcher.handleViewAction({
            type: 'test-callback'
        });
        expect(methodSpy.called).to.be.true;
    });
});
