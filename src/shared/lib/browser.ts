type NavigatorWithUAData = Navigator & {
	userAgentData?: {
		brands?: Array<{
			brand: string;
			version: string;
		}>;
	};
};

function getNavigator() {
	if (typeof navigator === "undefined") {
		return null;
	}

	return navigator as NavigatorWithUAData;
}

export function isSafariBrowser() {
	const currentNavigator = getNavigator();
	if (!currentNavigator) {
		return false;
	}

	const uaDataBrands = currentNavigator.userAgentData?.brands ?? [];
	if (
		uaDataBrands.some(({ brand }) => brand === "Safari") ||
		uaDataBrands.some(({ brand }) => brand === "Mobile Safari")
	) {
		return true;
	}

	const userAgent = currentNavigator.userAgent;
	return (
		/\bSafari\//.test(userAgent) &&
		!/\bChrome\//.test(userAgent) &&
		!/\bChromium\//.test(userAgent) &&
		!/\bCriOS\//.test(userAgent) &&
		!/\bEdg\//.test(userAgent) &&
		!/\bEdgiOS\//.test(userAgent) &&
		!/\bOPR\//.test(userAgent) &&
		!/\bOPiOS\//.test(userAgent) &&
		!/\bFxiOS\//.test(userAgent)
	);
}

export function applyBrowserDatasetAttribute(doc?: Document) {
	if (typeof document === "undefined" && !doc) {
		return;
	}

	const targetDocument = doc ?? document;
	if (isSafariBrowser()) {
		targetDocument.documentElement.dataset.browser = "safari";
		return;
	}

	delete targetDocument.documentElement.dataset.browser;
}
