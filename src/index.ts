/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Bot, Context, webhookCallback } from 'grammy';
import { analyzeInstance, AnalyzeResponse } from './services/analyze';
import { fileInstance } from './services/file/file.services';
import { FetchError } from 'ofetch';

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
	TELEGRAM_BOT_INFO?: string;
	TELEGRAM_BOT_TOKEN: string;
	BACKEND_BASE_URL: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const apiAnalyze = analyzeInstance(env.BACKEND_BASE_URL);
		const apiFile = fileInstance(env.TELEGRAM_BOT_TOKEN);
		const botInfo = env.TELEGRAM_BOT_INFO ? JSON.parse(env.TELEGRAM_BOT_INFO) : undefined;

		const bot = new Bot(env.TELEGRAM_BOT_TOKEN, { botInfo });

		bot.command('start', async (ctx: Context) => {
			await ctx.reply('Hello, world!');
		});

		bot.on('message:photo', async (ctx: Context) => {
			try {
				await ctx.reply('Analyzing the image...');

				const fileMeta = await ctx.getFile();
				const file = await apiFile(fileMeta.file_path!, {
					responseType: 'blob',
				});

				const imageFile = new Blob([file], { type: 'image/jpeg' });

				const formData = new FormData();
				formData.append('image', imageFile);

				const res = await apiAnalyze<AnalyzeResponse>('/', {
					method: 'POST',
					body: formData,
				});

				await ctx.reply(res.message);
			} catch (e) {
				console.error('Error analyzing the image: ' + JSON.stringify((e as FetchError).data));
				await ctx.reply('Error: ' + JSON.stringify((e as FetchError).data));
			}
		});

		return webhookCallback(bot, 'cloudflare-mod')(request);
	},
};
