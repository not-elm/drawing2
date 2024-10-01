module.exports = {
	presets: [
		[
			"@babel/preset-env",
			{
				targets: "> 0.25%, not dead",
			},
		],
		[
			"@babel/preset-react",
			{ runtime: "automatic", importSource: "@emotion/react" },
		],
		"@babel/preset-typescript",
	],
};
