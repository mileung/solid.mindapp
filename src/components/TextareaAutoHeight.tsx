import { JSX } from 'solid-js';

const resize = (node: HTMLTextAreaElement) => {
	setTimeout(() => {
		node.style.height = 'auto';
		node.style.height = node.scrollHeight + 'px';
	}, 0);
};

const TextareaAutoHeight = (props: JSX.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
	let internalRef: undefined | HTMLTextAreaElement;
	let mounted = false;

	return (
		<textarea
			{...props}
			ref={(ref) => {
				if (mounted) return;
				mounted = true;
				ref && resize(ref);
				internalRef = ref;
				// if (typeof parentRef === 'function') {
				// 	parentRef(ref);
				// } else {
				// 	parentRef && (parentRef = ref);
				// }
			}}
			// I'm cool with auto height just on mount
			onChange={(e) => {
				// @ts-ignore
				props.onChange?.(e);
				internalRef && resize(internalRef);
			}}
		/>
	);
};
export default TextareaAutoHeight;
