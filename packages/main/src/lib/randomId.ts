export function randomId(): string {
	return (
		Math.random().toString(36).slice(2, 9) +
		Math.random().toString(36).slice(2, 9)
	);
}
