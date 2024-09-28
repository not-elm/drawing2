import { CardSection } from "../Card";
import { useCanvasEventHandler } from "../StoreProvider";

export function OrderSection() {
	const handlers = useCanvasEventHandler();

	return (
		<CardSection
			css={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "stretch",
				gap: 4,
			}}
			onMouseDown={(ev) => {
				ev.stopPropagation();
			}}
		>
			<button
				type="button"
				onClick={(ev) => {
					ev.stopPropagation();
					handlers.handleBringToFrontButtonClick();
				}}
			>
				最前面へ
			</button>
			<button
				type="button"
				onClick={(ev) => {
					ev.stopPropagation();
					handlers.handleBringForwardButtonClick();
				}}
			>
				ひとつ前へ
			</button>
			<button
				type="button"
				onClick={(ev) => {
					ev.stopPropagation();
					handlers.handleSendBackwardButtonClick();
				}}
			>
				ひとつ後ろへ
			</button>
			<button
				type="button"
				onClick={(ev) => {
					ev.stopPropagation();
					handlers.handleSendToBackButtonClick();
				}}
			>
				最背面へ
			</button>
		</CardSection>
	);
}
