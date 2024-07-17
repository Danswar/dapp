import PositionRow from "./BorrowRow";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery } from "@frankencoin/api";

export default function BorrowTable() {
	const { openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const openPositions: PositionQuery[] = [];

	for (const collateral in openPositionsByCollateral) {
		openPositions.push(...openPositionsByCollateral[collateral]);
	}

	const matchingPositions: PositionQuery[] = openPositions.filter((position) => parseInt(position.availableForClones) > 0n);

	return (
		<Table>
			<TableHeader
				headers={["Collateral", "Loan to Value", "Eff. Interest", "Liq. Price", "Available"]}
				subHeaders={["Symbol", "Reserve Ratio", "Ann. Interest", "Markt Price", "Maturity"]}
			/>
			<TableBody>
				{matchingPositions.length == 0 ? (
					<TableRowEmpty>{"There are no other positions yet."}</TableRowEmpty>
				) : (
					matchingPositions.map((pos) => <PositionRow position={pos} key={pos.position} />)
				)}
			</TableBody>
		</Table>
	);
}
