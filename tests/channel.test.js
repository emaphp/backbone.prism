describe('Prism.Channel tests', function() {
    it('Should implement events API', function () {
        var channel = new Backbone.Prism.Channel();

        expect(channel.trigger).to.equal(Backbone.Events.trigger);
        expect(channel.listenTo).to.equal(Backbone.Events.listenTo);
        expect(channel.listenToOnce).to.equal(Backbone.Events.listenToOnce);
        expect(channel.stopListening).to.equal(Backbone.Events.stopListening);
        expect(channel.on).to.equal(Backbone.Events.on);
        expect(channel.off).to.equal(Backbone.Events.off);
        expect(channel.request).to.equal(Backbone.Radio.Requests.request);
        expect(channel.reply).to.equal(Backbone.Radio.Requests.reply);
    });

    it('Should stop listening when destroyed', function () {
        var channel = new Backbone.Prism.Channel();

        var callbacks = {
            replier: function () {
                return;
            },

            listener: function () {
                return;
            }
        };

		var replierSpy = sinon.spy(callbacks, 'replier');
		var listenerSpy = sinon.spy(callbacks, 'listener');

		// Setup event handling
		channel.reply('request', callbacks.replier);
        channel.on('event', callbacks.listener);

        // Trigger events
        channel.request('request');
        channel.trigger('event');

        channel.destroy();

        channel.request('request');
        channel.trigger('event');

        expect(replierSpy.called).to.be.true;
        expect(listenerSpy.called).to.be.true;

        expect(replierSpy.calledOnce).to.be.true;
        expect(listenerSpy.calledOnce).to.be.true;
    });

    it('Should stop listening after reset', function () {
        var channel = new Backbone.Prism.Channel();

        var callbacks = {
            replier: function () {
                return;
            },

            listener: function () {
                return;
            }
        };

		var replierSpy = sinon.spy(callbacks, 'replier');
		var listenerSpy = sinon.spy(callbacks, 'listener');

		// Setup event handling
		channel.reply('request', callbacks.replier);
        channel.on('event', callbacks.listener);

        // Trigger events
        channel.request('request');
        channel.trigger('event');

        channel.reset();

        channel.request('request');
        channel.trigger('event');

        expect(replierSpy.called).to.be.true;
        expect(listenerSpy.called).to.be.true;

        expect(replierSpy.calledOnce).to.be.true;
        expect(listenerSpy.calledOnce).to.be.true;
    });
});
