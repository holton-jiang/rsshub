import { Route, ViewType } from '@/types';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';
import { Context } from 'hono';

export const route: Route = {
    name: 'DockerHub Repositories',
    description: `List of repositories for an image owner`,
    maintainers: ['CaoMeiYouRen'],
    path: '/repositories/:owner',
    categories: ['program-update'],
    view: ViewType.Notifications,
    example: '/dockerhub/repositories/library',
    parameters: { owner: 'Image owner' },
    handler,
};

async function handler(ctx: Context) {
    const { owner, limits } = ctx.req.param();
    const link = `https://hub.docker.com/r/${owner}`;
    const url = `https://hub.docker.com/v2/repositories/${owner}`;
    const response = await got(url, {
        searchParams: {
            page_size: Number.parseInt(limits) || 10,
        },
    });
    const item = response.data.results.map((repo) => ({
        title: repo.name,
        description: `${repo.description}<br>status: ${repo.status_description}<br>stars: ${repo.star_count}<br>pulls: ${repo.pull_count}`,
        link: `https://hub.docker.com/r/${owner}/${repo.name}`,
        author: owner,
        pubDate: parseDate(repo.last_updated),
        guid: `${owner}/${repo.name}`,
    }));
    return {
        title: `${owner} repositories`,
        description: `List of repositories for ${owner}`,
        link,
        item,
    };
}
