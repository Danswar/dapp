import dynamic from "next/dynamic";
import { useContractUrl } from "../../hooks/useContractUrl";
import { zeroAddress } from "viem";
import Link from "next/link";
import { PositionQuery } from "@frankencoin/api";
const TokenLogo = dynamic(() => import("../TokenLogo"), { ssr: false });

interface Props {
	position: PositionQuery;
	className?: string;
}

export default function GovernancePositionsRowType({ position, className }: Props) {
	const url = useContractUrl(position.collateral || zeroAddress);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<div className={`-ml-12 flex items-center ${className}`}>
			<Link href={url} onClick={openExplorer}>
				<div className="mr-4 cursor-pointer">
					<TokenLogo currency={position.collateralSymbol} />
				</div>
			</Link>

			<div className="flex flex-col">
				<span className={`text-left`}>{position.collateralSymbol}</span>
			</div>
		</div>
	);
}
