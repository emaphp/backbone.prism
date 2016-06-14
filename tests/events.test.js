describe('Prism.Channel tests', function() {
    it('Should implement events API', function () {
        expect(Backbone.Prism.Events.trigger).to.equal(Backbone.Events.trigger);
        expect(Backbone.Prism.Events.listenTo).to.equal(Backbone.Events.listenTo);
        expect(Backbone.Prism.Events.listenToOnce).to.equal(Backbone.Events.listenToOnce);
        expect(Backbone.Prism.Events.stopListening).to.equal(Backbone.Events.stopListening);
        expect(Backbone.Prism.Events.on).to.equal(Backbone.Events.on);
        expect(Backbone.Prism.Events.off).to.equal(Backbone.Events.off);
		expect(Backbone.Prism.Events.request).to.equal(Backbone.Radio.Requests.request);
        expect(Backbone.Prism.Events.reply).to.equal(Backbone.Radio.Requests.reply);
    });
});
