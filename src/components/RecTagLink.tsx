import { A } from '@solidjs/router';
import { RecursiveTag } from '../utils/tags';

const RecTagLink = (props: { recTag: RecursiveTag; isRoot?: boolean; onClick: () => void }) => {
	const { recTag, isRoot, onClick } = props;
	return (
		<div class="mt-0.5">
			{isRoot ? (
				<p class="text-fg1 px-2">{recTag.label}</p>
			) : (
				<A
					class="rounded transition px-1.5 font-medium border-2 text-fg2 border-mg1 hover:text-fg1 hover:border-mg2"
					href={`/?q=${encodeURIComponent(`[${recTag.label}]`)}`}
					onClick={onClick}
				>
					{recTag.label}
				</A>
			)}
			<div class="pl-3 border-l-2 border-mg2">
				{isRoot && !recTag.subRecTags && <p class="text-fg2">No subtags</p>}
				{recTag.subRecTags?.map((subRecTag) => (
					<RecTagLink recTag={subRecTag} onClick={onClick} />
				))}
			</div>
		</div>
	);
};

export default RecTagLink;
