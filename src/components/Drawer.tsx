import { createEffect, createSignal, JSX } from 'solid-js';

const width = 'w-[70%] max-w-lg md:min-w-80 md:w-[30%]';

const Drawer = (props: { isOpen: () => boolean; onClose?: () => void; children: JSX.Element }) => {
	const { isOpen, onClose, children } = props;
	const [showBackdrop, setShowBackdrop] = createSignal(false);
	const [backdropOpacity, setBackdropOpacity] = createSignal(false);

	createEffect(() => {
		if (isOpen()) {
			setShowBackdrop(true);
			setTimeout(() => setBackdropOpacity(true), 10);
		} else {
			setBackdropOpacity(false);
			const timer = setTimeout(() => setShowBackdrop(false), 300);
			return () => clearTimeout(timer);
		}
	});

	return (
		<>
			{/* Backdrop */}
			{showBackdrop() && (
				<div
					class={`block md:hidden fixed inset-0 bg-black z-50 transition-opacity duration-300 ease-in-out ${
						backdropOpacity() ? 'opacity-50' : 'opacity-0'
					}`}
					onClick={onClose}
					aria-hidden="true"
				/>
			)}
			<div
				class={`block md:hidden rounded-r fixed inset-y-0 left-0 z-50 bg-bg2 shadow-lg transform ${width} ${
					isOpen() ? 'translate-x-0' : '-translate-x-full'
				} transition-transform duration-300 ease-in-out`}
			>
				<div>{children}</div>
			</div>
		</>
	);
};

export default Drawer;
