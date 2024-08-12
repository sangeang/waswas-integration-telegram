import { ofetch } from 'ofetch';

export const analyzeInstance = (baseUrl: string) =>
	ofetch.create({
		baseURL: `${baseUrl}/analyze`,
	});
