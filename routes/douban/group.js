const axios = require('axios');

module.exports = async (ctx) => {
    const groupid = ctx.params.groupid;

    const response = await axios({
        method: 'get',
        url: `https://api.douban.com/v2/group/${groupid}/topics?start=0&count=100`,
    });

    const topics = response.data.topics;

    // 替换图片到内容中
    topics.map((topic) => {
        const { content, photos } = topic;
        topic.content = content.replace(/<图片(\d*)>/g, function() {
            try {
                const photo = photos.filter((p) => (p.seq_id = arguments[1]))[0];
                const src = photo.alt;
                return `<img referrerpolicy="no-referrer" src='${src}'/><br />`;
            } catch (ex) {
                console.log(arguments);
                console.log(photos);
                console.log(ex);
                return '';
            }
        });
        return topic;
    });

    ctx.state.data = {
        title: `豆瓣小组-${groupid}`,
        link: `https://www.douban.com/group/${groupid}/`,
        item: topics.map((topic) => ({
            title: `${topic.title} from ${topic.author.name}`,
            description: `${topic.content}`,
            link: topic.link,
        })),
    };
};
