import { ofetch } from 'ofetch';

export const fileInstance = (token: string) =>
	ofetch.create({
		baseURL: `https://api.telegram.org/file/bot${token}`,
	});
