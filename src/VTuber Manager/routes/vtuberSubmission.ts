import { methods, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';
import { IsArray, IsIn, IsObject, IsOptional, IsString, validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import VTuberFormResponseModel from '../lib/VTubers';
import VTuberManager from '../lib/VTuberManager';

class requiredFormData {
	@IsString()
	'Discord ID': string;

	@IsString()
	@IsIn(['Yes', 'No'])
	'Do you want to delete your application?': string;

	@IsString()
	'ResponseID': string;
}

export class VTuberFormTemplate {
	@IsString()
	'Discord ID': string;

	@IsString()
	@IsIn(['Yes', 'No'])
	'Do you want to delete your application?': string;

	@IsObject()
	'VTuber Avatar (Square Size Preferred)': {
		mime: string;
		64: string;
	};

	@IsString()
	'VTuber Name': string;

	@IsString()
	'Description (3rd person perspective recommended)': string;

	@IsString()
	@IsOptional()
	'Lore (if any)': string;

	@IsString()
	'Model Type': string;

	@IsString()
	'Debut Date': string;

	@IsString()
	@IsOptional()
	'Group Code': string;

	@IsArray()
	'Genre': string[];

	@IsString()
	'Language': string;

	@IsString()
	@IsIn(['Yes', 'No'])
	@IsOptional()
	'Do you stream?': string;

	@IsString()
	@IsOptional()
	'Twitch / YouTube URL': string;

	@IsString()
	@IsIn(['Yes', 'No'])
	@IsOptional()
	'Do you make regular content? (Videos)': string;

	@IsString()
	@IsOptional()
	'YouTube / TikTok URL': string;

	@IsString()
	'ResponseID': string;
}

export class UserRoute extends Route {
	public constructor(context: Route.LoaderContext, options: Route.Options) {
		super(context, {
			...options,
			route: 'vtuber/submit'
		});
	}

	public async [methods.POST](request: ApiRequest, response: ApiResponse) {
		const rawData = plainToClass(requiredFormData, request.body);
		const validationErrors = await validate(rawData);

		if (validationErrors.length !== 0) {
			return response.badRequest(validationErrors);
		}

		let existingData = await VTuberFormResponseModel.findOne({ 'Discord ID': rawData['Discord ID'] });

		if (existingData) {
			if (existingData.ResponseID !== rawData['ResponseID']) {
				return response.unauthorized({ message: 'This is not the original form response!' });
			}

			if (rawData['Do you want to delete your application?'] === 'Yes') {
				await VTuberManager.deleteApplication(rawData['Discord ID']);
				return response.ok({ message: 'Application deleted' });
			}
		}

		const vtuberForm = plainToClass(VTuberFormTemplate, request.body);
		const formValidate = await validate(vtuberForm);

		if (formValidate.length !== 0) {
			return response.badRequest({ errors: formValidate });
		}

		if (!existingData) {
			await VTuberManager.newApplication(vtuberForm);
			return response.ok({ message: 'Application created' });
		}

		await VTuberManager.updateApplication(vtuberForm);

		return response.ok({ message: 'Application updated' });
	}
}
