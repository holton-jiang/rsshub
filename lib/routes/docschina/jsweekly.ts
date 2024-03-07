import got from '@/utils/got';
import { load } from 'cheerio';

export default async (ctx) => {
    const baseURL = 'https://docschina.org';
    const path = '/news/weekly/js';
    const { data: res } = await got(`${baseURL}${path}`);

    // @ts-ignore
    const $ = load(res);

    const rss: {
        title?: string;
        link?: string;
    } = {};

    const title = $('head title').text();
    rss.title = title;
    const dataEl = $('#__NEXT_DATA__');
    const dataText = dataEl.text();
    const data = JSON.parse(dataText);
    ctx.set('data', {
        title,
        link: baseURL + path,
        item: data?.props?.pageProps?.data?.map((item) => ({
            title: item.title,
            description: item.description,
            link: baseURL + path + '/' + item.issue,
            author: item.editors?.join(','),
            itunes_item_image: item.imageUrl,
        })),
    });
};
