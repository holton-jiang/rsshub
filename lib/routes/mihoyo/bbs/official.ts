import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { art } from '@/utils/render';
import path from 'node:path';
import { parseDate } from '@/utils/parse-date';

// 游戏id
const GITS_MAP = {
    1: '崩坏三',
    2: '原神',
    3: '崩坏二',
    4: '未定事件簿',
    6: '崩坏：星穹铁道',
    8: '绝区零',
};

// 公告类型
const TYPE_MAP = {
    1: '公告',
    2: '活动',
    3: '资讯',
};

// 游戏缩写
const GAME_SHORT_MAP = {
    1: 'bh3',
    2: 'ys',
    3: 'bh2',
    4: 'wd',
    6: 'sr',
    8: 'zzz',
};
// 游戏官方页所属分区
const OFFICIAL_PAGE_MAP = {
    1: '6',
    2: '28',
    3: '31',
    4: '33',
    6: '53',
    8: '58',
};

const getNewsList = async ({ gids, type, page_size, last_id }) => {
    const query = new URLSearchParams({
        gids,
        type,
        page_size,
        last_id,
    }).toString();
    const url = `https://bbs-api.miyoushe.com/post/wapi/getNewsList?${query}`;
    const response = await got({
        method: 'get',
        url,
    });
    const list = response?.data?.data?.list;
    return list;
};

const getPostContent = (list) =>
    Promise.all(
        list.map(async (row) => {
            const post = row.post;
            const post_id = post.post_id;
            const query = new URLSearchParams({
                post_id,
            }).toString();
            const url = `https://bbs-api.miyoushe.com/post/wapi/getPostFull?${query}`;
            return await cache.tryGet(url, async () => {
                const res = await got({
                    method: 'get',
                    url,
                });
                const gid = res?.data?.data?.post?.post?.game_id || '2';
                const author = res?.data?.data?.post?.user?.nickname || '';
                const content = res?.data?.data?.post?.post?.content || '';
                const tags = res?.data?.data?.post?.topics?.map((item) => item.name) || [];
                const description = art(path.join(__dirname, '../templates/official.art'), {
                    hasCover: post.has_cover,
                    coverList: row.cover_list,
                    content,
                });
                return {
                    // 文章标题
                    title: post.subject,
                    // 文章链接
                    link: `https://www.miyoushe.com/${GAME_SHORT_MAP[gid]}/article/${post_id}`,
                    // 文章正文
                    description,
                    // 文章发布日期
                    pubDate: parseDate(post.created_at * 1000),
                    // 文章标签
                    category: tags,
                    author,
                };
            });
        })
    );

export const route: Route = {
    path: '/bbs/official/:gids/:type?/:page_size?/:last_id?',
    categories: ['game'],
    example: '/mihoyo/bbs/official/2/3/20/',
    parameters: { gids: '游戏id', type: '公告类型，默认为 2(即 活动)', page_size: '分页大小，默认为 20 ', last_id: '跳过的公告数，例如指定为 40 就是从第 40 条公告开始，可用于分页' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: '米游社 - 官方公告',
    maintainers: ['CaoMeiYouRen'],
    handler,
    description: `游戏 id

  | 崩坏三 | 原神 | 崩坏二 | 未定事件簿 | 星穹铁道 | 绝区零 |
  | ------ | ---- | ------ | ---------- | -------- | ------ |
  | 1      | 2    | 3      | 4          | 6        | 8      |

  公告类型

  | 公告 | 活动 | 资讯 |
  | ---- | ---- | ---- |
  | 1    | 2    | 3    |`,
};

async function handler(ctx) {
    const { gids, type = '2', page_size = '20', last_id = '' } = ctx.req.param();

    const list = await getNewsList({ gids, type, page_size, last_id });
    const items = await getPostContent(list);
    const title = `米游社 - ${GITS_MAP[gids] || ''} - ${TYPE_MAP[type] || ''}`;
    const url = `https://www.miyoushe.com/${GAME_SHORT_MAP[gids]}/home/${OFFICIAL_PAGE_MAP[gids]}?type=${type}`;
    const data = {
        title,
        link: url,
        item: items,
    };

    return data;
}
