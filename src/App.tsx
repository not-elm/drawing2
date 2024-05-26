import type { FC } from "react";
import {css} from "@emotion/react";

export const App: FC = () => {
	return <h1 css={css`
		color: red;
		background-color: black;
	`}>Hello World</h1>;
};
