import { LTypeOptions, OmitSeeder } from "../../../../../../../dxf-writer/lib";

export const AppLineTypes = {
	DASHED : "DASHED"
}

export class AppLineTypesFactory {

	public static AppLineTypes(): OmitSeeder<LTypeOptions>[]{
		return [
			this.DASHED()
		]
	}

	public static DASHED(): OmitSeeder<LTypeOptions> {
		const options: OmitSeeder<LTypeOptions> = {
			name: AppLineTypes.DASHED,
			elements: [.5,-.25]
		};
		return options;
	}

}