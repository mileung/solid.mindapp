import { Button } from './Button';

export function InputPicker(props: {
	title: string;
	options: string[];
	value: string;
	onSubmit: (value: string) => void;
}) {
	const { title, options, value, onSubmit } = props;
	return (
		<div>
			<p class="leading-4 font-semibold">{title}</p>
			<div class="mt-1.5 fx gap-2">
				{options.map((option) => (
					<Button
						key={option}
						on={value === option}
						onClick={() => onSubmit(option)}
						label={option}
					/>
				))}
			</div>
		</div>
	);
}
