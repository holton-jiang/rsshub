const utils = require('./utils');

module.exports = async (ctx) => {
    ctx.state.data = await utils.getData({
        site: 'www',
        channel: ctx.params.channel,
    });
};
