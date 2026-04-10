type NavigatorWithUAData = Navigator & {
	userAgentData?: {
		brands?: Array<{
			brand: string;
			version: string;
		}>;
	};
};

function getNavigator() {
	return navigator as NavigatorWithUAData;
}

export function isChromeBrowser() {
	const uaDataBrands = getNavigator().userAgentData?.brands ?? [];
	if (uaDataBrands.some(({ brand }) => brand === "Google Chrome")) {
		return true;
	}

	const userAgent = getNavigator().userAgent;
	return (
		/\bChrome\//.test(userAgent) &&
		!/\bEdg\//.test(userAgent) &&
		!/\bOPR\//.test(userAgent)
	);
}
