const cheerio = require('cheerio');
const axios = require('../../utils/axios');
const iconv = require('iconv-lite');
const url = require('url');

const base = 'http://www.t66y.com';
const section = 'thread0806.php?fid=';
const axios_ins = axios.create({
    headers: {
        Referer: base,
    },
    responseType: 'arraybuffer',
});

function killViidii(originUrl) {
    const decodeStr = /.*\?http/g;
    const decodeSig = /______/g;
    const jsSuffix = '&amp;z';
    const htmlSuffix = '&z';
    const returnSuffix = 'return false';
    if (originUrl.indexOf('viidii') !== -1) {
        return originUrl
            .replace(decodeStr, 'http')
            .replace(decodeSig, '.')
            .replace(jsSuffix, '')
            .replace(htmlSuffix, '')
            .replace(returnSuffix, '');
    } else {
        return originUrl;
    }
}

const sourceTimezoneOffset = -8;
const filterReg = /read\.php/;

module.exports = async (ctx) => {
    const res = await axios_ins.get(url.resolve(base, `${section}${ctx.params.id}&search=today`));
    const data = iconv.decode(res.data, 'gbk');
    const $ = cheerio.load(data);
    let list = $('#ajaxtable > tbody:nth-child(2)');
    list = $('.tr2', list)
        .not('.tr2.tac')
        .nextAll()
        .slice(0, -1)
        .get();

    const parseContent = (htmlString) => {
        htmlString = iconv.decode(htmlString, 'gbk');
        let $ = cheerio.load(htmlString);
        let time = $('#main > div:nth-child(4) > table > tbody > tr:nth-child(2) > th > div').text();
        const regex = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/;
        const regRes = regex.exec(time);
        time = regRes === null ? new Date() : new Date(regRes[0]);
        time.setTime(time.getTime() + (sourceTimezoneOffset - time.getTimezoneOffset() / 60) * 60 * 60 * 1000);

        const content = $('#main > div:nth-child(4) > table > tbody > tr.tr1.do_not_catch > th:nth-child(2) > table > tbody > tr > td > div.tpc_content.do_not_catch').html();

        // Change the image tag to display image in rss reader
        try {
            $ = cheerio.load(content);
        } catch (error) {
            return null;
        }

        // Handle video
        const video = $('a:nth-of-type(2)');
        if (video) {
            const videoScript = video.attr('onclick');
            const regVideo = /https?:\/\/.*'/;
            const videoRes = regVideo.exec(videoScript);
            if (videoRes && videoRes.length !== 0) {
                let link = videoRes[0];
                link = link.slice(0, link.length - 1);
                $('iframe').attr('src', link);
            }
        }
        // Handle img tag
        let images = $('img');
        for (let k = 0; k < images.length; k++) {
            $(images[k]).replaceWith(`<img src="${$(images[k]).attr('data-src')}" referrerpolicy="no-referrer" />`);
        }
        // Handle input tag
        images = $('input');
        for (let k = 0; k < images.length; k++) {
            $(images[k]).replaceWith(`<img src="${$(images[k]).attr('data-src')}" referrerpolicy="no-referrer" />`);
        }

        // Handle links
        const links = $('a[href*="viidii"]');
        for (let k = 0; k < links.length; k++) {
            $(links[k]).attr('href', killViidii($(links[k]).attr('href')));
        }

        return {
            description: $.html(),
            pubDate: time.toUTCString(),
        };
    };

    const out = await Promise.all(
        list.map(async (item) => {
            const $ = cheerio.load(item);
            let title = $('.tal h3 a');
            const path = title.attr('href');

            // Filter duplicated entries
            if (path.match(filterReg) !== null) {
                return Promise.resolve('');
            }
            const link = url.resolve(base, path);

            // Check cache
            const cache = await ctx.cache.get(link);
            if (cache) {
                return Promise.resolve(JSON.parse(cache));
            }

            if (
                cheerio
                    .load(title)('font')
                    .text() !== ''
            ) {
                title = cheerio
                    .load(title)('font')
                    .text();
            } else {
                title = title.text();
            }

            if (!title) {
                return Promise.resolve('');
            }

            const single = {
                title: title,
                link: link,
                guid: path,
            };

            try {
                const response = await axios_ins.get(url.resolve(base, path));
                const result = parseContent(response.data);

                if (!result) {
                    return Promise.resolve('');
                }

                single.description = result.description;
                single.pubDate = result.pubDate;
            } catch (err) {
                return Promise.resolve('');
            }
            ctx.cache.set(link, JSON.stringify(single), 3 * 60 * 60);
            return Promise.resolve(single);
        })
    );

    ctx.state.data = {
        title: $('title').text(),
        link: url.resolve(base, `${section}${ctx.params.id}`),
        item: out.filter((item) => item !== ''),
    };
};
