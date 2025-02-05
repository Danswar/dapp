import AppBox from "@components/AppBox";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { ADDRESS } from "@contracts";
import { useFPSQuery, usePoolStats, useTradeQuery } from "@hooks";
import { useChainId } from "wagmi";
import dynamic from "next/dynamic";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function EquityFPSDetailsCard() {
	const chainId = useChainId();
	const poolStats = usePoolStats();
	const { profit, loss } = useFPSQuery(ADDRESS[chainId].frankenCoin);
	const { trades } = useTradeQuery();

	return (
		<div className="bg-card-body-primary shadow-lg rounded-xl p-4 grid grid-cols-1 gap-2">
			<div id="chart-timeline">
				<div className="flex justify-between">
					<div>
						<DisplayLabel label="FPS Price" />
						<DisplayAmount className="mt-4" amount={poolStats.equityPrice} currency="ZCHF" />
					</div>
					<div className="text-right">
						<DisplayLabel label="Supply" />
						<DisplayAmount className="mt-4" amount={poolStats.equitySupply} currency="FPS" />
					</div>
				</div>
				<ApexChart
					type="area"
					options={{
						theme: {
							monochrome: {
								color: "#092f62",
								enabled: true,
							},
						},
						chart: {
							type: "area",
							height: 300,
							dropShadow: {
								enabled: false,
							},
							toolbar: {
								show: false,
							},
							zoom: {
								enabled: false,
							},
							background: "0",
						},
						stroke: {
							width: 3,
						},
						dataLabels: {
							enabled: false,
						},
						grid: {
							show: false,
						},
						xaxis: {
							type: "datetime",
							labels: {
								show: false,
							},
							axisBorder: {
								show: false,
							},
							axisTicks: {
								show: false,
							},
						},
						yaxis: {
							show: false,
						},
						fill: {
							type: "gradient",
							gradient: {
								shadeIntensity: 0,
								opacityTo: 0.2,
								shade: "#e7e7ea",
								gradientToColors: ["#092f62"],
							},
						},
					}}
					series={[
						{
							name: "FPS Price",
							data: trades.map((trade) => {
								return [parseFloat(trade.time) * 1000, Math.round(Number(trade.lastPrice) / 10 ** 16) / 100];
							}),
						},
					]}
				/>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
				<AppBox>
					<DisplayLabel label="Market Cap" />
					<DisplayAmount amount={(poolStats.equitySupply * poolStats.equityPrice) / BigInt(1e18)} currency="ZCHF" />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Reserve" />
					<DisplayAmount amount={poolStats.frankenTotalReserve} currency="ZCHF" address={ADDRESS[chainId].frankenCoin} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Equity Capital" />
					<DisplayAmount amount={poolStats.frankenEquity} currency="ZCHF" address={ADDRESS[chainId].frankenCoin} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Minter Reserve" />
					<DisplayAmount amount={poolStats.frankenMinterReserve} currency="ZCHF" address={ADDRESS[chainId].frankenCoin} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Income" />
					<DisplayAmount amount={profit} currency="ZCHF" className="text-text-success" address={ADDRESS[chainId].frankenCoin} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Spendings" />
					<DisplayAmount amount={loss} currency="ZCHF" className="text-text-warning" address={ADDRESS[chainId].frankenCoin} />
				</AppBox>
			</div>
		</div>
	);
}
