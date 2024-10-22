import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import util from './utils';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/news/hk',
    categories: ['game'],
    example: '/nintendo/news/hk',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['nintendo.com.hk/topics', 'nintendo.com.hk/'],
        },
    ],
    name: 'News（Hong Kong）',
    maintainers: ['benzking'],
    handler,
    url: 'nintendo.com.hk/topics',
};

async function handler(ctx) {
    const response = await got('https://www.nintendo.com.hk/api/top/topics_pickup');
    const data = response.data.slice(0, ctx.req.query('limit') ? Number(ctx.req.query('limit')) : 30);

    // 获取新闻正文
    const result = await util.ProcessNews(data, cache);

    return {
        title: 'Nintendo（香港）主页资讯',
        link: 'https://www.nintendo.com.hk/topics/',
        description: 'Nintendo 香港有限公司官网刊登的资讯',
        item: result.map((item) => ({
            title: item.title,
            description: item.content,
            link: `https://www.nintendo.com.hk${item.url}`,
            pubDate: parseDate(item.release_date, 'YYYY.MM.DD'),
        })),
    };
}
